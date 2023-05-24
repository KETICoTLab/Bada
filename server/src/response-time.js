let responseTimeList = {
  get: [],
  post: [],
  put: [],
  delete: []
};

let methods = ['get', 'post', 'put', 'delete'];

let clearResponseTime = () => {
  let emptyResponseTimeObject = {
    get: [],
    post: [],
    put: [],
    delete: []
  };

  responseTimeList = emptyResponseTimeObject;
}

let responseTimeStore = (responseTime, methodType) => {
  let responseTimeInt = Number(responseTime.slice(0, -2));

  if(!methodType) { return; }
  
  responseTimeList[methodType].push(responseTimeInt);
}

let averageResponseTime = (methodType) => {
  let average = {
    get: 0,
    post: 0,
    put: 0,
    delete: 0
  };

  if(!methodType) {
    methods.forEach((type)=> {
      let methodSum = 0;
      
      if(responseTimeList[type].length) {
        methodSum = responseTimeList[type].reduce((accumulator, currentValue) => {
          return accumulator + currentValue;
        })
        average[type] = (methodSum/responseTimeList[type].length).toFixed(0);        
      }
    })
  } else {
    if(responseTimeList[methodType].length === 0) {
      return 0;
    }

    sum = responseTimeList[methodType].reduce((acc, currentValue) => {
      return acc + currentValue;
    })
  }

  return average;
}


module.exports = {
  clear: clearResponseTime,
  store: responseTimeStore,
  average: averageResponseTime
}