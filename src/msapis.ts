/**
 * 
 * File contains functions that communicate with apis at Microsoft's servers to enable auth, fetching firewall rules and editing firewall rules.
 * 
 */
import axios from 'axios';
import qs from 'qs';

const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID;
const resourceGroupName = process.env.AZURE_RESOURCE_GROUP_NAME;
const serverName = process.env.AZURE_DB_SERVER_NAME;
const tenantId = process.env.AZURE_TENANT_ID;
const clientSecret = process.env.AZURE_CLIENT_SECRET;
const clientId = process.env.AZURE_CLIENT_ID;

type AuthResponse = {
  token_type: string;
  expires_in: number;
  ext_expires_in: number;
  access_token: string;
}

export type ExistingFirewallRule = {
  properties: {
    startIpAddress: string;
    endIpAddress: string;
  };
  id: string;
  name: string;
  type: string;
}

type ExistingFirewallRuleResponse = {
  value: ExistingFirewallRule[];
}

export const signIn = () => {

  let data = qs.stringify({
    'client_id': clientId,
    'scope': 'https://management.azure.com/.default',
    'client_secret': clientSecret,
    'grant_type': 'client_credentials'
  });

  let config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': 'fpc=AoCEXrmi-4lAmY-gjnptE5wj9pTdAQAAABKeHt8OAAAA; stsservicecookie=estsfd; x-ms-gateway-slice=estsfd'
    },
    data: data
  };

  return new Promise<string>((resolve, reject) => {
    axios.request<AuthResponse>(config)
      .then((response) => {
        if (response.data?.access_token) {
          resolve(response.data.access_token);
        } else {
          reject('no token in response from auth');
        }
      })
      .catch((error) => {
        reject(error);
      });
  })
}

export const fetchExistingRules = async () => {
  let config = {
    method: 'get',
    maxBodyLength: Infinity,
    url: `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.Sql/servers/${serverName}/firewallRules?api-version=2021-11-01`,
    headers: {
      'Authorization': 'Bearer ' + await signIn()
    }
  };


  try {
    const response = await axios.request<ExistingFirewallRuleResponse>(config);
    return response.data?.value;
  } catch (ex) {
    console.error(ex);
    throw Error('Failed getting existing firewall rules');
  }

}

export const createFirewallRule = async (ipAddress: string) => {
  try {

    const firewallRuleName = 'D-' + ipAddress;

    let data = JSON.stringify({
      "properties": {
        "startIpAddress": ipAddress,
        "endIpAddress": ipAddress
      }
    });

    let config = {
      method: 'put',
      maxBodyLength: Infinity,
      url: `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.Sql/servers/${serverName}/firewallRules/${firewallRuleName}?api-version=2021-11-01`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + await signIn()
      },
      data: data
    };

    const response = await axios.request(config);
    console.log(JSON.stringify(response.data));
    return;
  } catch (ex) {
    console.error(ex);
    throw Error('Failed creating new firewall rule');
  }

}

export const deleteFirewallRule = async (firewallRuleName: string) => {
  //DELETE 
  try {
    let config = {
      method: 'delete',
      maxBodyLength: Infinity,
      url: `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.Sql/servers/${serverName}/firewallRules/${firewallRuleName}?api-version=2021-11-01`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + await signIn()
      },
    };

    axios.request(config)
      .then((response) => {
        console.log(JSON.stringify(response.data));
      })
      .catch((error) => {
        console.log(error);
      });
  } catch (ex) {
    console.error(ex);
    throw Error('Failed deleting firewall rule');
  }
}