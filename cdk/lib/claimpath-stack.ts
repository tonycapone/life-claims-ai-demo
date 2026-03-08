import { Construct } from 'constructs';
import { Platform } from 'aws-cdk-lib/aws-ecr-assets';
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';

const DOMAIN = 'claimpath.click';

export class ClaimPathStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ─── DNS + TLS ──────────────────────────────────────────────────────────
    const zone = route53.HostedZone.fromLookup(this, 'Zone', {
      domainName: DOMAIN,
    });

    const certificate = new acm.Certificate(this, 'SiteCert', {
      domainName: DOMAIN,
      validation: acm.CertificateValidation.fromDns(zone),
    });

    // ─── VPC — public + private subnets, single NAT gateway ─────────────────
    const vpc = new ec2.Vpc(this, 'ClaimPathVPC', {
      maxAzs: 2,
      natGateways: 1, // 1 shared NAT (default is 1 per AZ — this saves ~$32/mo)
    });

    // ─── ECS Cluster ─────────────────────────────────────────────────────────
    const cluster = new ecs.Cluster(this, 'ClaimPathCluster', { vpc });

    // ─── RDS Postgres — t3.micro, single AZ, minimum storage ─────────────────
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
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO), // ~$13/mo
      allocatedStorage: 20,        // minimum
      maxAllocatedStorage: 20,     // no autoscaling
      securityGroups: [dbSecurityGroup],
      credentials: rds.Credentials.fromSecret(dbCredentials),
      multiAz: false,              // single AZ
      publiclyAccessible: false,
      databaseName: 'claimpath',
      backupRetention: cdk.Duration.days(1), // minimum allowed
      deleteAutomatedBackups: true,
      storageType: rds.StorageType.GP2,      // cheapest storage type
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ─── S3 — claim document uploads ─────────────────────────────────────────
    const documentsBucket = new s3.Bucket(this, 'DocumentsBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.PUT, s3.HttpMethods.GET],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
        },
      ],
    });

    // ─── S3 — frontend (React PWA) ────────────────────────────────────────────
    const frontendBucket = new s3.Bucket(this, 'FrontendBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // ─── ECS Task Role ────────────────────────────────────────────────────────
    const taskRole = new iam.Role(this, 'ClaimPathTaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });

    dbCredentials.grantRead(taskRole);
    documentsBucket.grantReadWrite(taskRole);

    // Bedrock — invoke Claude models
    taskRole.addToPolicy(new iam.PolicyStatement({
      actions: ['bedrock:InvokeModel', 'bedrock:InvokeModelWithResponseStream'],
      resources: ['arn:aws:bedrock:*::foundation-model/*'],
    }));

    // Allow ECS tasks → RDS
    database.connections.allowFrom(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(5432),
      'Allow from ECS tasks'
    );

    // ─── ECS Fargate — 256 CPU / 512MB (minimum), private subnet, 1 task ────
    const backendService = new ecs_patterns.ApplicationLoadBalancedFargateService(
      this,
      'ClaimPathBackend',
      {
        cluster,
        cpu: 256,            // 0.25 vCPU — minimum
        memoryLimitMiB: 512, // 512MB — minimum
        desiredCount: 1,     // single task — no redundancy
        taskSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
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
          taskRole,
        },
        publicLoadBalancer: true,
      }
    );

    backendService.targetGroup.configureHealthCheck({
      path: '/api/health',
      port: '8000',
    });

    // ─── CloudFront — claimpath.click, US/EU only ───────────────────────────
    const oai = new cloudfront.OriginAccessIdentity(this, 'OAI');
    frontendBucket.grantRead(oai);

    const distribution = new cloudfront.CloudFrontWebDistribution(this, 'ClaimPathCDN', {
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100, // US + EU only
      viewerCertificate: cloudfront.ViewerCertificate.fromAcmCertificate(certificate, {
        aliases: [DOMAIN],
        securityPolicy: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      }),
      originConfigs: [
        {
          // Frontend — S3
          s3OriginSource: {
            s3BucketSource: frontendBucket,
            originAccessIdentity: oai,
          },
          behaviors: [{ isDefaultBehavior: true }],
        },
        {
          // Backend API — ALB
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
              defaultTtl: cdk.Duration.seconds(0), // no API caching
              minTtl: cdk.Duration.seconds(0),
              maxTtl: cdk.Duration.seconds(0),
            },
          ],
        },
      ],
      errorConfigurations: [
        // SPA routing
        { errorCode: 404, responseCode: 200, responsePagePath: '/index.html' },
        { errorCode: 403, responseCode: 200, responsePagePath: '/index.html' },
      ],
    });

    // ─── Route53 A record → CloudFront ──────────────────────────────────────
    new route53.ARecord(this, 'SiteRecord', {
      zone,
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
    });

    // ─── Outputs ──────────────────────────────────────────────────────────────
    new cdk.CfnOutput(this, 'SiteURL', {
      value: `https://${DOMAIN}`,
      description: 'ClaimPath app URL',
    });

    new cdk.CfnOutput(this, 'CloudFrontDistributionId', {
      value: distribution.distributionId,
      description: 'CloudFront distribution ID (for cache invalidation on deploy)',
    });

    new cdk.CfnOutput(this, 'FrontendBucketName', {
      value: frontendBucket.bucketName,
      description: 'S3 bucket for frontend deployment',
    });

    new cdk.CfnOutput(this, 'DocumentsBucketName', {
      value: documentsBucket.bucketName,
      description: 'S3 bucket for claim documents',
    });

    new cdk.CfnOutput(this, 'APIEndpoint', {
      value: `http://${backendService.loadBalancer.loadBalancerDnsName}`,
      description: 'Backend ALB endpoint',
    });
  }
}
