import { Amplify } from 'aws-amplify';

const awsConfig = {
  Auth: {
    region: process.env.NEXT_PUBLIC_AWS_REGION,
    userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
    userPoolWebClientId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_WEB_CLIENT_ID,
    identityPoolId: process.env.NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID,
    authenticationFlowType: 'USER_SRP_AUTH',
    signUpVerificationMethod: 'phone', // or 'email'
    passwordSettings: {
      minimumLength: 8,
      requireNumbers: true,
      requireUppercase: true,
      requireLowercase: true,
      requireSymbols: true,
    },
  },
};

// Configure Amplify
Amplify.configure(awsConfig);

export default awsConfig; 