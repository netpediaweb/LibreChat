const axios = require('axios');

const DEFAULT_TIMEOUT_MS = 30000;

const getProxyConfig = () => {
  const baseURL = process.env.PISTON_PROXY_BASEURL;
  const apiKey = process.env.PISTON_PROXY_API_KEY;

  if (!baseURL || !apiKey) {
    return null;
  }

  return { baseURL, apiKey };
};

const getAxiosClient = (config) =>
  axios.create({
    baseURL: config.baseURL,
    timeout: DEFAULT_TIMEOUT_MS,
    headers: {
      'x-api-key': config.apiKey,
    },
  });

const getRuntimes = async () => {
  const config = getProxyConfig();
  if (!config) {
    return null;
  }

  const client = getAxiosClient(config);
  const response = await client.get('/api/v2/runtimes');
  return response.data;
};

const execute = async (payload) => {
  const config = getProxyConfig();
  if (!config) {
    return null;
  }

  const client = getAxiosClient(config);
  const response = await client.post('/api/v2/execute', payload);
  return response.data;
};

module.exports = {
  getProxyConfig,
  getRuntimes,
  execute,
};
