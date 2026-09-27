@description('Globally unique Static Web App name')
param appName string = 'agentic-retail-ops-${uniqueString(resourceGroup().id)}'
param location string = 'eastus2'

resource staticApp 'Microsoft.Web/staticSites@2023-12-01' = {
  name: appName
  location: location
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {
    allowConfigFileUpdates: true
    stagingEnvironmentPolicy: 'Enabled'
  }
}

output staticWebAppName string = staticApp.name
output defaultHostname string = staticApp.properties.defaultHostname
