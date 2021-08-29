import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import {
  ElasticBeanstalkClient,
  CreateApplicationCommand,
  UpdateEnvironmentCommand
} from '@aws-sdk/client-elastic-beanstalk'
import * as fs from 'fs'

const uploadAppBundle = async (
  awsRegion: string,
  s3Bucket: string,
  s3Key: string,
  filePath: string
): Promise<void> => {
  try {
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
  } catch (error) {
    throw new Error(JSON.stringify(error))
  }
}

const createAppVersion = async (
  awsRegion: string,
  ebsAppName: string,
  s3Bucket: string,
  s3Key: string,
  versionLabel: string
): Promise<void> => {
  try {
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

    const command = new CreateApplicationCommand(params)
    await client.send(command)
  } catch (error) {
    throw new Error(JSON.stringify(error))
  }
}

const deployApp = async (
  awsRegion: string,
  ebsAppName: string,
  ebsEnvironmentName: string,
  awsPlatform: string,
  versionLabel: string
): Promise<void> => {
  try {
    const client = new ElasticBeanstalkClient({
      region: awsRegion
    })

    const params = {
      ApplicationName: ebsAppName,
      EnvironmentName: ebsEnvironmentName,
      VersionLabel: versionLabel,
      PlatformArn: awsPlatform
    }

    const command = new UpdateEnvironmentCommand(params)
    await client.send(command)
  } catch (error) {
    throw new Error(JSON.stringify(error))
  }
}

export const deploy = async (
  ebsAppName: string,
  ebsEnvironmentName: string,
  s3Bucket: string,
  s3Key: string,
  awsRegion: string,
  awsPlatform: string,
  filePath: string,
  versionLabel: string
): Promise<void> => {
  try {
    // upload app bundle to S3
    await uploadAppBundle(awsRegion, s3Bucket, s3Key, filePath)

    // create new application version on ElasticBeanstalk
    // using S3 file as source bundle
    await createAppVersion(awsRegion, ebsAppName, s3Bucket, s3Key, versionLabel)

    // deploy new application version to application
    // environment on ElasticBeanstalk
    await deployApp(
      awsRegion,
      ebsAppName,
      ebsEnvironmentName,
      awsPlatform,
      versionLabel
    )
  } catch (error) {
    console.error(error)
  }
}
