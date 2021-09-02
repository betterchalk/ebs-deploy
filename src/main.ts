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

    const timeout = Number(processTimeout)
    if (isNaN(timeout) || timeout < 0) {
      throw new Error('process-timeout should be a positive integer')
    }

    await deploy(
      ebsAppName,
      ebsEnvironmentName,
      s3Bucket,
      s3Key,
      awsRegion,
      filePath,
      versionLabel,
      timeout
    )
  } catch (error: any) {
    core.setFailed(error.message)
  }
}

run()
