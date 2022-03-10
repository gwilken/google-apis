const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = [
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/documents.readonly',
];

  // The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

// Load client secrets from a local file.
fs.readFile('credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  // Authorize a client with credentials, then call the Google Drive API.
  authorize(JSON.parse(content), listFiles);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */

 async function authorize(credentials, callback) {
  const { client_email, private_key } = credentials;

  const jwtClient = new google.auth.JWT(client_email, null, private_key, SCOPES)

  // Check if we have previously stored a token.
  // fs.readFile(TOKEN_PATH, (err, token) => {
  //   if (err) return this.getAccessToken(jwtClient, callback);
  //   jwtClient.setCredentials(JSON.parse(token.toString()));
  //   console.log('Token loaded from file');
  //   callback(jwtClient);
  // });
  listFiles(jwtClient)

  printDocTitle(jwtClient)

  printDocBody(jwtClient)

}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

/**
 * Lists the names and IDs of up to 10 files.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listFiles(auth) {
  const drive = google.drive({version: 'v3', auth});

  drive.files.list({
    pageSize: 10,
    fields: 'nextPageToken, files(id, name)',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const files = res.data.files;
    if (files.length) {
      console.log('Files:');
      files.map((file) => {
        console.log(`${file.name} (${file.id})`);
      });
    } else {
      console.log('No files found.');
    }
  });

  drive.files.export({
    fileId: '1z6rNa66hZh7m__4zDQcpb5Gz7p8ZbpFj_lQK0mu0QQE',
    // mimeType: "application/rtf",
    mimeType: "text/html",
    // mimeType: "text/plain",
    fields: "data",
  }, (err, res) => {
    if (err) {
      console.log('The API returned an error: ' + err);
    } else {
      console.log(res)
    }
  });
}


function printDocBody(auth) {
  const docs = google.docs({version: 'v1', auth});
  docs.documents.get({
  documentId: '1z6rNa66hZh7m__4zDQcpb5Gz7p8ZbpFj_lQK0mu0QQE'
}).then(function(res) {
  // var doc = res.result;
  // let jsonDoc = JSON.stringify(doc.body, null, 4);
  // console.log(jsonDoc)
  // console.log(res)
  fs.writeFile('test_doc.json', JSON.stringify(res.data), (err) => {
    if (err) return console.error(err);
    console.log('File stored to', 'test_doc.json');
  });

},function(res) {
  console.log('Error: ' + res.result.error.message);
  });
}


function printDocTitle(auth) {
  const docs = google.docs({version: 'v1', auth});
  docs.documents.get({
    documentId: '1z6rNa66hZh7m__4zDQcpb5Gz7p8ZbpFj_lQK0mu0QQE',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    console.log(`The title of the document is: ${res.data.title}`);
  });
}

