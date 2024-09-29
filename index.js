const AWS = require('aws-sdk');
const crypto = require('crypto');
AWS.config.update({ region: 'us-east-1' });
const cognito = new AWS.CognitoIdentityServiceProvider();

// Variáveis de ambiente necessárias
const USER_POOL_ID = process.env.USER_POOL_ID || "us-east-1_JAEJ36QvU";
const CLIENT_ID = process.env.CLIENT_ID || "62p4s74ipilqfcd7n4v91rbcf5";
const CLIENT_SECRET = process.env.CLIENT_SECRET || "fv45lpgmcksv3jmd4mnt74ngsn7qf6u6pdmep4nor6jtoi0umil";

function generateSecretHash(username, clientId, clientSecret) {
    return crypto
      .createHmac('SHA256', clientSecret)
      .update(username + clientId)
      .digest('base64');
}

exports.handler = async (event) => {
    // Verifica se é uma requisição POST e se tem o body

    const method = event.requestContext?.http?.method;

    console.log(`EVENTO = ${method} `);
    //console.log(event);

    if (method !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: 'Método não permitido, use POST' }),
            headers: {
                'Content-Type': 'application/json',
            }
        };
    }

    let body;
    try {
        body = JSON.parse(event.body);  // O API Gateway envia o body como string
    } catch (error) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Requisição inválida: JSON mal formatado' }),
            headers: {
                'Content-Type': 'application/json',
            }
        };
    }

    const { document, password } = body;

    if (!document) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Parâmetros ausentes: document e password são obrigatórios' }),
            headers: {
                'Content-Type': 'application/json',
            }
        };
    }

    try {
        const authParams = {
            UserPoolId: USER_POOL_ID,
            ClientId: CLIENT_ID,
            AuthFlow: 'ADMIN_NO_SRP_AUTH',
            AuthParameters: {
                USERNAME: document,
                PASSWORD: "L75svw@90",
                //SECRET_HASH: generateSecretHash(document, CLIENT_ID, CLIENT_SECRET) // Opcional: adicione se necessário
            }
        };

        // Chama o Cognito para autenticar o usuário
        const authResponse = await cognito.adminInitiateAuth(authParams).promise();

        // Retorna o token de autenticação
        return {
            statusCode: 200,
            body: JSON.stringify({
                accessToken: authResponse.AuthenticationResult.AccessToken,
                idToken: authResponse.AuthenticationResult.IdToken,
                refreshToken: authResponse.AuthenticationResult.RefreshToken,
                expiresIn: authResponse.AuthenticationResult.ExpiresIn
            }),
            headers: {
                'Content-Type': 'application/json',
            }
        };

    } catch (error) {
        console.error('Erro ao autenticar o usuário:', error);
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Falha na autenticação', error: error.message }),
            headers: {
                'Content-Type': 'application/json',
            }
        };
    }
};
