# Azure Functions - TypeScript Starter

![Node.js CI](https://github.com/ltwlf/azure-functions-starter-ts/workflows/Node.js%20CI/badge.svg)

A starter project for TypeScript based Azure Functions with jest unit testing. 
You can instantly start coding with [Gitpod](https://gitpod.io) or clone the repo and work locally. When you clone the project locally, you have to install the [Azure Functions Core Tools 3.0](https://github.com/Azure/azure-functions-core-tools) manually. 

[Gitpod](https://www.gitpod.io/) is an online dev evinroment (based on VSCode) and can launch ready-to-code dev environments for your GitHub or GitLab project with a single click.
It is free for open source projects and is just great to share your running code with the community.

[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/ltwlf/azure-functions-starter-ts)

You can either prefix the URL in the address bar of your browser with https://gitpod.io/#https://github.com/ltwlf/azure-functions-starter-ts or push the Gitpod button if you have installed the Gitpod [extension](https://www.gitpod.io/docs/browser-extension/).

After your Gitpod has launched or your cloned the project, you can upate the npm packages to the latest versions (optional).

```
npm update --save/--save-dev
```

## Getting Started

Add a function
```
func new
```
Choose Typescript, select template and enter the name for your func. When you use any other template then 'HttpTrigger' you need to configure the "AzureWebJobsStorage" (see bellow).

Build and start the func host

```
npm run build
func start
```

Or just debug with VSCode and the precofigured "Attach to Node Function" launch configuration.

## Tests

The starter is already configured for unit testing with jest and includes a sample hello function with test.

Run tests
```
npm test
```

## Configure Function Storage

All binding excepts the HttpTrigger need a configured blob storage. In our Gitpod we can use the [Azurite](https://www.npmjs.com/package/azurite) emulator as dev storage.

Install the emulator
```
npm install --save-dev azurite
```

In *local.settings.json* replace {AzureWebJobsStorage} with 
```
DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://127.0.0.1:10000/devstoreaccount1;
```

Start the emulator
```
npx azurite-blob
```

## Deploy to Azure
Use the Azure Functions GitHub [Actions](https://github.com/marketplace/actions/azure-functions-action) to deploy your function project to [Azure](https://portal.azure.com).


**Happy Func Coding!**
