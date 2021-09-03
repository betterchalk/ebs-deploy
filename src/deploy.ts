import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import {
  ElasticBeanstalkClient,
  CreateApplicationVersionCommand,
  UpdateEnvironmentCommand,
  DescribeApplicationVersionsCommand
} from '@aws-sdk/client-elastic-beanstalk'
import * as fs from 'fs'

const uploadAppSourceBundle = async (
  awsRegion: string,
  s3Bucket: string,
  s3Key: string,
  filePath: string
): Promise<void> => {
  const client = new S3Client({
    region: awsRegion
  })

  const fileStream = fs.createReadStream(filePath)
  fileStream.on('error', function (error) {
    throw new Error(error.message)
  })

  const params = {
    Bucket: s3Bucket,
    Key: s3Key,
    Body: fileStream
  }

  const command = new PutObjectCommand(params)
  await client.send(command)
}

const createAppVersion = async (
  awsRegion: string,
  ebsAppName: string,
  s3Bucket: string,
  s3Key: string,
  versionLabel: string
): Promise<void> => {
  const client = new ElasticBeanstalkClient({
    region: awsRegion
  })

  const params = {
    ApplicationName: ebsAppName,
    AutoCreateApplication: true,
    Process: true,
    SourceBundle: {
      S3Bucket: s3Bucket,
      S3Key: s3Key
    },
    VersionLabel: versionLabel
  }

  const command = new CreateApplicationVersionCommand(params)
  await client.send(command)
}

const validateAppEnvConfig = async (
  awsRegion: string,
  ebsAppName: string,
  versionLabel: string,
  processTimeout: number
): Promise<void> => {
  const INTERVAL = 20
  const PROCESSED_STATUS = 'PROCESSED'

  const client = new ElasticBeanstalkClient({
    region: awsRegion
  })

  const command = new DescribeApplicationVersionsCommand({
    ApplicationName: ebsAppName,
    VersionLabels: [versionLabel]
  })

  const delay = async (seconds: number): Promise<void> =>
    new Promise((resolve) => {
      setTimeout(resolve, seconds * 1000)
    })

  const getProcessStatus = async (): Promise<boolean> => {
    const response = (await client.send(command)).ApplicationVersions
    if (!response) {
      throw new Error(
        `Application version (${versionLabel}) not found: ${response}`
      )
    }
    return response[0].Status?.toUpperCase() === PROCESSED_STATUS
  }

  let attempts = processTimeout / INTERVAL
  let isProcessed = await getProcessStatus()
  while (attempts > 0 && !isProcessed) {
    attempts--
    await delay(INTERVAL)
    isProcessed = await getProcessStatus()
  }

  if (!isProcessed) {
    throw new Error(
      `Timed out while waiting for application version (${versionLabel}) to recieve status: ${PROCESSED_STATUS}`
    )
  }
}

const deployApp = async (
  awsRegion: string,
  ebsAppName: string,
  ebsEnvironmentName: string,
  versionLabel: string
): Promise<void> => {
  const client = new ElasticBeanstalkClient({
    region: awsRegion
  })

  const params = {
    ApplicationName: ebsAppName,
    EnvironmentName: ebsEnvironmentName,
    VersionLabel: versionLabel
  }

  const command = new UpdateEnvironmentCommand(params)
  await client.send(command)
}

export const deploy = async (
  ebsAppName: string,
  ebsEnvironmentName: string,
  s3Bucket: string,
  s3Key: string,
  awsRegion: string,
  filePath: string,
  versionLabel: string,
  processTimeout: number
): Promise<void> => {
  // upload app source bundle to S3
  await uploadAppSourceBundle(awsRegion, s3Bucket, s3Key, filePath)

  // create new app version from S3 source in Elastic Beanstalk
  await createAppVersion(awsRegion, ebsAppName, s3Bucket, s3Key, versionLabel)

  // ensure Elastic Beanstalk config (if any) in new app version
  // was successfully pre-processed and validated
  await validateAppEnvConfig(
    awsRegion,
    ebsAppName,
    versionLabel,
    processTimeout
  )

  // deploy app to Elastic Beanstalk environment
  await deployApp(awsRegion, ebsAppName, ebsEnvironmentName, versionLabel)
}
