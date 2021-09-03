# ebs-deploy
Github Action workflow to deploy apps using AWS S3 and Elastic Beanstalk

Usage:
```yaml
uses: betterchalk/ebs-deploy@v1
with:
  ebs-app-name: myapp
  ebs-environment-name: myapp-env
  s3-bucket: myapp-bucket
  s3-key: myapp-v0.1.0.zip
  aws-region: us-east-2
  file-path: ./myapp.zip
  version-label: myapp-v0.1.0
```

Requires AWS authentication to be present in workflow environment. (see [test.yaml](.github/workflows/test.yaml))

---

## Development
Install the dependencies  
```bash
$ yarn install
```

Build the typescript and package it for distribution
```bash
$ yarn build && yarn package
```

Run the tests 
```bash
$ yarn test
```

Create PR to merge your feature branch into `main`

Create new tag from `main` branch
```bash
git tag -a -m "Description of this release" v1
git push --follow-tags
```
