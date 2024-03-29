import * as core from '@actions/core'
import { deploy } from './deploy'

const run = async (): Promise<void> => {
  try {
    const ebsAppName: string = core.getInput('ebs-app-name')
    const ebsEnvironmentName: string = core.getInput('ebs-environment-name')
    const s3Bucket: string = core.getInput('s3-bucket')
    const s3Key: string = core.getInput('s3-key')
    const awsRegion: string = core.getInput('aws-region')
    const filePath: string = core.getInput('file-path')
    const versionLabel: string = core.getInput('version-label')
    const processTimeout: string = core.getInput('process-timeout')
    const awsAccessKeyId: string = core.getInput('aws-access-key-id')
    const awsSecretAccessKey: string = core.getInput('aws-secret-access-key')
    const awsSessionToken: string = core.getInput('aws-session-token')

    const timeout = Number(processTimeout)
    if (isNaN(timeout) || timeout < 0) {
      throw new Error('process-timeout should be a positive integer')
    }

    const credentials = {
        awsAccessKeyId,
        awsSecretAccessKey,
        awsSessionToken

      }
    await deploy(
      ebsAppName,
      ebsEnvironmentName,
      s3Bucket,
      s3Key,
      awsRegion,
      filePath,
      versionLabel,
      timeout,
      credentials
       
    )
  } catch (error: any) {
    core.setFailed(error.message)
  }
}

run()
