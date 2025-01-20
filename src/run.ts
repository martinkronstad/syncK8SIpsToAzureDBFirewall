import dotenv from 'dotenv';
dotenv.config();

import { ExistingFirewallRule, fetchExistingRules, createFirewallRule, deleteFirewallRule } from './msapis';
import { getCurrentIPs } from './k8sapis';

const run = async () => {

  let currentIPs = await getCurrentIPs();
  const currentRules = await fetchExistingRules();
  const rulesToDelete: ExistingFirewallRule[] = [];

  console.log('Start checking for ips', currentIPs);
  // Loop all the rules, and check if the current ips are in the range...
  for (const rule of currentRules) {
    if (rule.properties.startIpAddress === rule.properties.endIpAddress) {
      // Check if the current ip is not in the currentIPs, if so we can delete it ...
      if (rule.name.substring(0, 2) === 'D-' && currentIPs.indexOf(rule.properties.startIpAddress) === -1) {
        // This firewall rule is a dynamic rule, and the ip address is NOT in the currentIPs, so we need to delete it ..
        rulesToDelete.push(rule);
      }
      // This is a single ip address, lets use this, we do not support ranges yet ..
      currentIPs = currentIPs.filter(i => i !== rule.properties.startIpAddress);
    }
  }

  console.log('Ok, we have removed the ips that already had a rule ... ', currentIPs);

  // Create new records for every row
  for (const ip of currentIPs) {
    console.log('creating rule for ip', ip);
    await createFirewallRule(ip);
  }

  for (const rule of rulesToDelete) {
    console.log('deleting rule', rule.name);
    await deleteFirewallRule(rule.name);
  }
  console.log('Job done');
}

run();