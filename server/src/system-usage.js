const systeminformation = require('systeminformation');

let systemUsage = async ()=> {
  let resources = {
    osUsage : {
      cpu: '',
      memory: ''
    },
    processUsage: {
      cpu: '',
      memory: ''
    }
  }
  resources.osUsage.memory = await systeminformation.mem().then(data => {
    let totalMemory= (data.used/data.total) * 100;

    return Math.ceil(totalMemory*100)/100;
  });
  resources.osUsage.cpu = await systeminformation.currentLoad().then(data=> {
    
    let upp = Math.ceil(data.currentload*100)/100;
    return upp;
  })
  resources.processUsage = await systeminformation.processes().then(data=> {
    let processUsage = {
      memory: '',
      cpu: ''
    }
  
    data.list.forEach((nodeprocess) => {
      if(nodeprocess.pid === process.pid) {
        processUsage.memory = Math.ceil(nodeprocess.pmem*100)/100;
        processUsage.cpu = Math.ceil(nodeprocess.pcpu*100)/100;
      } 
    })

    return processUsage;
  });

  return resources;
}

module.exports = {
  usage: systemUsage
}
