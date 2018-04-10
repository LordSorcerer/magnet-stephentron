// Import modules
const Discord = require('discord.js');
const firebaseAdmin = require('firebase-admin');
const firebaseFunctions = require('firebase-functions');
const botToken = require('./bot-token.json').token;
const databaseURL = require('./database.json').URL;
const serviceAccount = require('./serviceAccountKey.json');
// Create an instance of a Discord discordClient
const discordClient = new Discord.Client();
//Initialize firebase and create a db
// The token of your bot - https://discordapp.com/developers/applications/me

firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(serviceAccount, databaseURL)
});

const db = firebaseAdmin.firestore();

// Log our bot in
discordClient.login(botToken);

discordClient.on('ready', () => {
  console.log('Magnet Stephentron: Ready\n');
  downloadAllPolls(db, pollList)
});

// Create an event listener for messages
discordClient.on('message', message => {
  // If the message starts with the control character '=' prep and parse it
  if (message.content.charAt(0) === '=') {
    messageForParse = prepareMessageForParse(message);
    parseMessage(message, messageForParse);
  };
});

/////////////////////////////////////////

// List of all commands for help function
let commandList =
  "__help__: [=help] Displays this help section\n" +
  "__master__: [=master] Are you my Master?  Who is the true Master?\n" +
  "__time__: [=time] Displays the current time and date\n" +
  "__vote__: [=vote/Poll/Response #] Enters your vote in the named poll as the number specified.\n" +
  "__vote info__: [=vote info/Poll Name/reveal(optional)] Displays the current vote tallies in a DM. Adding 'reveal' makes this information public.\n" +
  "__add poll__: [=add poll/Poll Name/Poll Quesion/Response 1/Response 2/Response 3', etc.] Adds a new poll using the following format:  '\n" +
  "__remove poll__: [=remove poll/Poll Name] Removes the current poll completely.  Be careful with this...  " +
  "__list polls__: [=list polls] Lists all currently active polls\n" +
  "__poll info__: [=poll info/Poll Name] Displays basic information about the chosen poll, including the author, question and responses.\n";

const pollList = [];
//Constructor function to make a new poll
function poll(author, name, question, responses) {
  this.author = author;
  this.name = name;
  this.question = question;
  this.responses = responses;
  this.votes = [];
  this.voters = [];
  this.responses.forEach((response) => {
    this.votes.push(0);
  });
};

// The ready event is vital, it means that your bot will only start reacting to information
// from Discord _after_ ready is emitted

function parseMessage(message, messageForParse) {
  switch (messageForParse[0]) {
    case 'help':
      runCommandHelp(message, messageForParse);
      break;
    case 'time':
      runCommandTime(message, messageForParse);
      break;
    case 'master':
      runCommandMaster(message, messageForParse);
      break;
    case 'add poll':
      runCommandAddPoll(message, messageForParse, pollList, db);
      break;
    case 'list polls':
      runCommandListPolls(message, messageForParse, pollList);
      break;
    case 'poll info':
      runCommandPollInfo(message, messageForParse, pollList);
      break;
    case 'vote':
      runCommandVote(message, messageForParse, pollList, db);
      break;
    case 'vote info':
      runCommandVoteInfo(message, messageForParse, pollList);
      break;
    case 'delete poll':
      runCommandDeletePoll(message, messageForParse, pollList, db);
      break;
    default:
      ;
  };
};

function runCommandHelp(message, messageForParse) {
  message.channel.send(
    'Hello.  My name is Magnet Stephentron, a helper automaton created to serve the community.\n' +
    'I respond to the following commands:\n\n' + commandList);
};

function runCommandVote(message, messageForParse, pollList, db) {
  let currentVoter = message.author.username,
    pollName = messageForParse[1],
    response = messageForParse[2],
    voterPresent = false,
    pollListIndex = -1,
    poll;
  pollListIndex = findPoll(pollName, pollList);
  console.log(pollListIndex + pollListIndex);
  if (pollListIndex === -1) {
    message.channel.send('There is no such poll on record.  No vote will be entered.');
  } else {
    pollList[pollListIndex].voters.forEach((voter) => {
      if (voter === currentVoter) {
        voterPresent = true;
      };
    });

    if (voterPresent === false) {
      pollList[pollListIndex].voters.push(currentVoter);
      console.log(pollList[pollListIndex].voters);
      pollList[pollListIndex].votes[response]++;
      console.log(pollList[pollListIndex].votes);
      message.channel.send('Your vote has been entered.  Thank you for voting!');
      uploadPoll(db, pollList[pollListIndex]);
    } else {
      message.channel.send('Sorry, ' + currentVoter + ', but you have already voted in this poll.');
    };
  };
};

function runCommandTime(message, messageForParse) {
  message.channel.send('The current date/time is ' + message.createdAt);
};


function runCommandMaster(message, messageForParse) {
  if (message.author.username === 'Tradan') {
    message.channel.send('Greetings, Master.');
  } else {
    message.channel.send('You are not my Master...');
  };
};

function runCommandAddPoll(message, messageForParse, pollList, db) {
  let pollAuthor = message.author.username,
    pollName = messageForParse[1],
    pollQuestion = messageForParse[2],
    pollResponses = messageForParse.slice(3),
    newPoll = new poll(pollAuthor, pollName, pollQuestion, pollResponses);
  pollList.push(newPoll);
  message.channel.send('New poll created by ' + pollAuthor + ': \n__Name__: ' + pollName + '  __Question__: ' + pollQuestion + '  __Responses__: ' + pollResponses + '\n');
  console.log("New poll created: Author: " + pollAuthor + " Poll Name: " + pollName + " Question" + pollQuestion + " " + pollResponses + "\n");
  uploadPoll(db, newPoll);
  console.log("... and successfully uploaded.");
};

function runCommandDeletePoll(message, messageForParse, pollList, db) {
  let messageAuthor = message.author.username,
    pollName = messageForParse[1],
    pollIndex = findPoll(pollName, pollList);
  if (messageAuthor === pollList[pollIndex].author) {
    removePoll(pollIndex, pollList, db);
    message.channel.send(pollName + ' was successfully deleted.');
  } else {
    console.log('Authors do not match');
    message.channel.send('You are not the author of this poll.  Access is denied.');
  };
};

function runCommandVoteInfo(message, messageForParse, pollList) {
  let messageAuthor = message.author.username,
    pollName = messageForParse[1],
    revealToPublic = messageForParse[2],
    pollIndex = findPoll(pollName, pollList),
    tempVoteInfo = [];

  poll = pollList[pollIndex];

  if (messageAuthor !== poll.author) {
    console.log("You are not the author of this poll.  Access is denied.")
  } else {
    for (let i = 0; i < poll.responses.length; i++) {
      let tempResponses = '__' + poll.responses[i] + '__ : ' + poll.votes[i];
      tempVoteInfo.push(tempResponses);
    };
    //Unless the message author has specified 'reveal' as a third argument, send the vote info in a private message
    if (revealToPublic !== 'reveal') {
      message.author.send('Here is the current status of: __' + poll.name +
        '__\n__Question__: ' + poll.question + '\n' + tempVoteInfo.join('\n'));
    } else {
      message.channel.send('Here is the current status of: __' + poll.name +
        '__\n__Question__: ' + poll.question + '\n' + tempVoteInfo.join('\n'));
    };
  };




}

function runCommandPollInfo(message, messageForParse, pollList) {
  let pollName = messageForParse[1],
    pollIndex = findPoll(pollName, pollList);
  poll = pollList[pollIndex];
  message.channel.send('Here is the information you have requested:\n__Name__: ' + poll.name + '\n__Question__: ' + poll.question + '\n__Responses__: ' + poll.responses + '\n');
}

function runCommandListPolls(message, messageForParse, pollList) {
  let pollNames = pollList.map((poll) => {
    return '__' + poll.name + '__';
  });
  pollNames = pollNames.join('\n');
  message.channel.send('The currently running polls are as follows:\n\n' + pollNames);
};

function prepareMessageForParse(message) {
  let messageForParse = message.content.toLowerCase();
  // rip special character off
  messageForParse = messageForParse.slice(1);
  // add each argument to an array
  messageForParse = messageForParse.split("/");
  console.log(messageForParse);
  return messageForParse;
};

function findPoll(pollName, pollList) {
  let pollListIndex = -1;
  pollListIndex = pollList.findIndex(element => {
    return element.name === pollName;
  });
  return pollListIndex;
};

function removePoll(pollIndex, pollList, db) {
  let poll = pollList.splice(pollIndex, 1);
  const deleteDoc = db.collection('polls').doc(poll[0].name).delete();
};

//Can also be used to update an entry, say for voting
function uploadPoll(db, poll) {
  const docRef = db.collection('polls').doc(poll.name);
  const setPoll = docRef.set({
    author: poll.author,
    name: poll.name,
    question: poll.question,
    responses: poll.responses,
    votes: poll.votes,
    voters: poll.voters
  });
};

//Downloads a single poll by name
//downloadPoll(db, "sloking", pollList);
function downloadPoll(db, poll, pollList) {
  const docRef = db.collection('polls').doc(poll);
  docRef.get().then(function(doc) {
    if (doc.exists) {
      console.log('Document retrieved: ' + doc.data().name);
      pollList.push(doc.data());
    } else {
      console.log('Document not found.');
    }
  }).catch(function(error) {
    console.log('Error getting document:', error);
  });
  return
};


//Downloads all existing polls and pushes them into the pollList array
function downloadAllPolls(db, pollList) {
  const pollsRef = db.collection('polls');
  console.log('Magnet Stephentron: Downloading all polls from database...');
  const allPolls = pollsRef.get()
    .then(snapshot => {
            snapshot.forEach(doc => {
        pollList.push(doc.data());
        console.log('- "' + doc.data().name + '" pushed to pollList');
      });
      console.log('\nAll documents retrieved.');
    })
    .catch(err => {
      console.log('Error getting documents', err);
    });
};