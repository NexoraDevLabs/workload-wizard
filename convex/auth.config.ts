export default {
  providers: [
    {
      domain: process.env.WORKOS_ISSUER_URL,
      applicationID: process.env.WORKOS_CLIENT_ID,
    },
  ],
};