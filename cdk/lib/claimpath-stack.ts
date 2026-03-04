import { Construct } from 'constructs';
import { Platform } from 'aws-cdk-lib/aws-ecr-assets';
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';

export class ClaimPathStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ─── VPC + Cluster ───────────────────────────────────────────────────────
    const vpc = new ec2.Vpc(this, 'ClaimPathVPC', { maxAzs: 2 });
    const cluster = new ecs.Cluster(this, 'ClaimPathCluster', { vpc });

    // ─── RDS (Postgres) ───────────────────────────────────────────────────────
    const dbCredentials = new secretsmanager.Secret(this, 'DBCredentials', {
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'postgres' }),
        generateStringKey: 'password',
        excludePunctuation: true,
      },
    });

    const dbSecurityGroup = new ec2.SecurityGroup(this, 'DBSecurityGroup', {
      vpc,
      description: 'ClaimPath RDS security group',
      allowAllOutbound: true,
    });

    const database = new rds.DatabaseInstance(this, 'Database', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15,
      }),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.SMALL),
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      securityGroups: [dbSecurityGroup],
      credentials: rds.Credentials.fromSecret(dbCredentials),
      multiAz: false, // single AZ fine for demo
      publiclyAccessible: true,
      databaseName: 'claimpath',
      backupRetention: cdk.Duration.days(7),
      removalPolicy: cdk.RemovalPolicy.SNAPSHOT,
    });

    // ─── S3 for document uploads ──────────────────────────────────────────────
    const documentsBucket = new s3.Bucket(this, 'DocumentsBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.PUT, s3.HttpMethods.GET],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
        },
      ],
    });

    // ─── Anthropic API key secret ─────────────────────────────────────────────
    // Create manually: aws secretsmanager create-secret --name claimpath/anthropic-api-key --secret-string '{"key":"sk-ant-..."}'
    const anthropicSecret = secretsmanager.Secret.fromSecretNameV2(
      this, 'AnthropicApiKey', 'claimpath/anthropic-api-key'
    );

    // ─── ECS Task Role ────────────────────────────────────────────────────────
    const taskRole = new iam.Role(this, 'ClaimPathTaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });

    dbCredentials.grantRead(taskRole);
    anthropicSecret.grantRead(taskRole);
    documentsBucket.grantReadWrite(taskRole);

    database.connections.allowFrom(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(5432),
      'Allow from ECS tasks'
    );

    // ─── Fargate Service (Backend API) ────────────────────────────────────────
    const backendService = new ecs_patterns.ApplicationLoadBalancedFargateService(
      this,
      'ClaimPathBackend',
      {
        cluster,
        cpu: 256,
        memoryLimitMiB: 512,
        desiredCount: 1,
        taskImageOptions: {
          containerPort: 8000,
          image: ecs.ContainerImage.fromAsset('../backend', {
            platform: Platform.LINUX_AMD64,
          }),
          environment: {
            ENV: 'production',
            AWS_REGION: this.region,
            S3_BUCKET: documentsBucket.bucketName,
            DATABASE_URL: `postgresql://postgres:${dbCredentials.secretValueFromJson('password').unsafeUnwrap()}@${database.instanceEndpoint.hostname}:5432/claimpath?sslmode=require`,
          },
          secrets: {
            ANTHROPIC_API_KEY: ecs.Secret.fromSecretsManager(anthropicSecret, 'key'),
          },
          taskRole,
        },
        publicLoadBalancer: true,
      }
    );

    backendService.targetGroup.configureHealthCheck({
      path: '/api/health',
      port: '8000',
    });

    // ─── S3 + CloudFront (Frontend) ───────────────────────────────────────────
    const frontendBucket = new s3.Bucket(this, 'FrontendBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const oai = new cloudfront.OriginAccessIdentity(this, 'OAI');
    frontendBucket.grantRead(oai);

    const distribution = new cloudfront.CloudFrontWebDistribution(this, 'ClaimPathCDN', {
      originConfigs: [
        {
          // Frontend (S3)
          s3OriginSource: {
            s3BucketSource: frontendBucket,
            originAccessIdentity: oai,
          },
          behaviors: [{ isDefaultBehavior: true }],
        },
        {
          // Backend API (ALB)
          customOriginSource: {
            domainName: backendService.loadBalancer.loadBalancerDnsName,
            originProtocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
          },
          behaviors: [
            {
              pathPattern: '/api/*',
              allowedMethods: cloudfront.CloudFrontAllowedMethods.ALL,
              forwardedValues: {
                queryString: true,
                headers: ['Authorization', 'Content-Type'],
              },
            },
          ],
        },
      ],
      errorConfigurations: [
        {
          errorCode: 404,
          responseCode: 200,
          responsePagePath: '/index.html', // SPA routing
        },
        {
          errorCode: 403,
          responseCode: 200,
          responsePagePath: '/index.html',
        },
      ],
    });

    // ─── Outputs ──────────────────────────────────────────────────────────────
    new cdk.CfnOutput(this, 'CloudFrontURL', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'ClaimPath frontend URL',
    });

    new cdk.CfnOutput(this, 'APIEndpoint', {
      value: `http://${backendService.loadBalancer.loadBalancerDnsName}`,
      description: 'Backend API endpoint',
    });

    new cdk.CfnOutput(this, 'DocumentsBucket', {
      value: documentsBucket.bucketName,
      description: 'S3 bucket for claim documents',
    });
  }
}
