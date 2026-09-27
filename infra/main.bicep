@description('Use a region supporting Flex Consumption and your model deployments.')
param location string = 'eastus2'
param appName string = 'retail-${uniqueString(resourceGroup().id)}'
@description('Single-tenant Entra application registration client ID, with Retail.Demo app role.')
@minLength(36)
param authClientId string
param tenantId string = tenant().tenantId
@description('Budget alert recipients; budget is an alert, not a spending stop.')
@minLength(1)
param budgetEmails array
@description('First day of the current billing month, e.g. 2026-09-01T00:00:00Z.')
param budgetStartDate string
@allowed([
  'mock'
  'azure'
])
param modelProvider string = 'mock'
@description('Existing Azure OpenAI account in this resource group. Required for azure mode; model deployments are provisioned separately.')
param openAiAccountName string = ''
param demandModel string = 'retail-fast'
param inventoryModel string = 'retail-fast'
param allocationModel string = 'retail-reasoning'
param riskModel string = 'retail-risk'
@minValue(1)
@maxValue(100)
param dailyRunLimit int = 30

var storageName = 'retail${uniqueString(resourceGroup().id)}'
resource storage 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: storageName
  location: location
  sku: { name: 'Standard_LRS' }
  kind: 'StorageV2'
  properties: {
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
    allowBlobPublicAccess: false
    allowSharedKeyAccess: false
  }
}
resource blobs 'Microsoft.Storage/storageAccounts/blobServices@2023-05-01' = {
  parent: storage
  name: 'default'
}
resource containers 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' = [for name in [
  'runs'
  'deployment'
]: {
  parent: blobs
  name: name
  properties: { publicAccess: 'None' }
}]
resource retention 'Microsoft.Storage/storageAccounts/managementPolicies@2023-05-01' = {
  parent: storage
  name: 'default'
  properties: {
    policy: {
      rules: [{
        name: 'expire-demo-runs'
        enabled: true
        type: 'Lifecycle'
        definition: {
          filters: {
            blobTypes: ['blockBlob']
            prefixMatch: ['runs/']
          }
          actions: { baseBlob: { delete: { daysAfterModificationGreaterThan: 7 } } }
        }
      }]
    }
  }
}
resource workspace 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: '${appName}-logs'
  location: location
  properties: {
    sku: { name: 'PerGB2018' }
    retentionInDays: 30
    workspaceCapping: { dailyQuotaGb: json('0.1') }
  }
}
resource insights 'Microsoft.Insights/components@2020-02-02' = {
  name: '${appName}-insights'
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: workspace.id
    IngestionMode: 'LogAnalytics'
  }
}
resource plan 'Microsoft.Web/serverfarms@2024-04-01' = {
  name: '${appName}-plan'
  location: location
  kind: 'functionapp'
  sku: {
    name: 'FC1'
    tier: 'FlexConsumption'
  }
  properties: { reserved: true }
}
resource ai 'Microsoft.CognitiveServices/accounts@2024-10-01' existing = if (modelProvider == 'azure') {
  name: openAiAccountName
}
resource app 'Microsoft.Web/sites@2024-04-01' = {
  name: appName
  location: location
  kind: 'functionapp,linux'
  identity: { type: 'SystemAssigned' }
  properties: {
    serverFarmId: plan.id
    httpsOnly: true
    functionAppConfig: {
      deployment: {
        storage: {
          type: 'blobContainer'
          value: '${storage.properties.primaryEndpoints.blob}deployment'
          authentication: { type: 'SystemAssignedIdentity' }
        }
      }
      runtime: {
        name: 'node'
        version: '22'
      }
      scaleAndConcurrency: {
        maximumInstanceCount: 40
        instanceMemoryMB: 512
        triggers: { http: { perInstanceConcurrency: 4 } }
      }
    }
    siteConfig: {
      minTlsVersion: '1.2'
      scmMinTlsVersion: '1.2'
      ftpsState: 'Disabled'
      appSettings: [
        {
          name: 'AzureWebJobsStorage__accountName'
          value: storage.name
        }
        {
          name: 'AzureWebJobsStorage__credential'
          value: 'managedidentity'
        }
        {
          name: 'STATE_STORAGE_URL'
          value: storage.properties.primaryEndpoints.blob
        }
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: insights.properties.ConnectionString
        }
        {
          name: 'MODEL_PROVIDER'
          value: modelProvider
        }
        {
          name: 'AZURE_OPENAI_ENDPOINT'
          value: modelProvider == 'azure' ? '${ai!.properties.endpoint}openai/v1/' : ''
        }
        {
          name: 'MODEL_DEMAND'
          value: demandModel
        }
        {
          name: 'MODEL_INVENTORY'
          value: inventoryModel
        }
        {
          name: 'MODEL_ALLOCATION'
          value: allocationModel
        }
        {
          name: 'MODEL_RISK'
          value: riskModel
        }
        {
          name: 'DAILY_RUN_LIMIT'
          value: string(dailyRunLimit)
        }
        {
          name: 'FUNCTIONS_REQUEST_BODY_SIZE_LIMIT'
          value: '2048'
        }
      ]
    }
  }
  dependsOn: [containers]
}
resource auth 'Microsoft.Web/sites/config@2024-04-01' = {
  parent: app
  name: 'authsettingsV2'
  properties: {
    platform: { enabled: true }
    globalValidation: {
      requireAuthentication: true
      unauthenticatedClientAction: 'Return401'
      excludedPaths: [
        '/'
        '/index.html'
        '/app.js'
        '/data.js'
        '/styles.css'
      ]
    }
    identityProviders: {
      azureActiveDirectory: {
        enabled: true
        registration: {
          clientId: authClientId
          openIdIssuer: 'https://login.microsoftonline.com/${tenantId}/v2.0'
        }
        validation: {
          allowedAudiences: [
            authClientId
            'api://${authClientId}'
          ]
        }
      }
    }
    httpSettings: { requireHttps: true }
  }
}
// Blob Data Owner is required for identity-based Functions host storage.
resource blobRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(storage.id, app.id, 'blob-owner')
  scope: storage
  properties: {
    principalId: app.identity.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', 'b7e6dc6d-f1e8-4753-8033-0f276bb0955b')
  }
}
resource aiRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (modelProvider == 'azure') {
  name: guid(ai!.id, app.id, 'openai-user')
  scope: ai
  properties: {
    principalId: app.identity.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '5e0bd9bd-7b93-4f28-af87-19fc36ad61bd')
  }
}
resource budget 'Microsoft.Consumption/budgets@2023-11-01' = {
  name: '${appName}-monthly-budget'
  properties: {
    category: 'Cost'
    amount: 200
    timeGrain: 'Monthly'
    timePeriod: { startDate: budgetStartDate }
    notifications: {
      warning: {
        enabled: true
        operator: 'GreaterThanOrEqualTo'
        threshold: 50
        contactEmails: budgetEmails
        thresholdType: 'Actual'
      }
      urgent: {
        enabled: true
        operator: 'GreaterThanOrEqualTo'
        threshold: 80
        contactEmails: budgetEmails
        thresholdType: 'Actual'
      }
      forecast: {
        enabled: true
        operator: 'GreaterThanOrEqualTo'
        threshold: 100
        contactEmails: budgetEmails
        thresholdType: 'Forecasted'
      }
    }
  }
}
output functionAppName string = app.name
output demoUrl string = 'https://${app.properties.defaultHostName}'
output principalId string = app.identity.principalId
