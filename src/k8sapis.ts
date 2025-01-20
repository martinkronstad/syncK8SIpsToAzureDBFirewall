import axios from 'axios';
import https from 'https';

type K8SNode = {
  metadata: {
    name: string;
  };
  status: {
    addresses: {
      type: 'ExternalIP' | 'InternalIP';
      address: string;
    }[]
  };
}

type K8SNodesQueryResponse = {
  items: K8SNode[];
}

export const getCurrentIPs = async () => {
  const url = process.env.KUBERNETES_URL;
  const token = process.env.KUBERNETES_TOKEN;

  let config = {
    method: 'get',
    httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    maxBodyLength: Infinity,
    url: `${url}/api/v1/nodes`,
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };

  try {
    const currentIPs = [];
    const response = await axios.request<K8SNodesQueryResponse>(config);
    if (response.data?.items && response.data?.items.length > 0) {
      for (const node of response.data?.items) {
        if (node.status?.addresses) {
          for (const address of node.status.addresses) {
            if (address.type === 'ExternalIP') {
              currentIPs.push(address.address);
            }
          }
        }
      }
    }
    else {
      throw Error('No K8S nodes returned');
    }

    return currentIPs;
  } catch (ex) {
    console.error(ex);
    throw Error('Failed getting existing firewall rules');
  }
}