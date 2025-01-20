# Sync Azure Database firewall with Google Cloud Kubernetes public ips

A small script to enable you to run a job syncing the current ips of a Kubernets-cluster with the firewall permissions for Azure Database (MS SQL in Azure)

## Setup permissions

In order to do this, you will need permissions to fetch current external ips of you kubernets cluster, and permissions to manipulate firewall rules in Azure Database.

### Azure Database permissions
You will need to create an app registration in Azure Entra ID. 
This app will need to have an role assigned in the correct subscription. 
Go to the subscription that manages the Azure Database, then go to Access control (IAM). 
Add a role assignment to the app with the role "SQL Security Manager"

### Kubernetes service account
You will need to create a service account, and assign that service account an role.

```
kubectl create serviceaccount --namespace default my-api-user

kubectl create clusterrolebinding my-api-user-binding --clusterrole=cluster-admin --serviceaccount=default:my-api-user

kubectl apply -f - <<EOF
apiVersion: v1
kind: Secret
metadata:
  name: my-api-user-secret
  namespace: default
  annotations:
    kubernetes.io/service-account.name: my-api-user
type: kubernetes.io/service-account-token
EOF

kubectl get secret --namespace default my-api-user-secret -o=jsonpath="{.data.token}" | base64 -D -i -
```

The last command will output a long lived JWT you can use for authenticating against the cluster.