const http = require('http');
const url = require('url');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const jwtKey = "token_key";
const jwtExpirySeconds = 24*3600;

// Parameters
const numberOfCharacterPerLine = 80;
const numberOfWordsMax = 80000;

// User data
const validUsers = {
	user : "nom@domaine.com"
};

var numberOfWordsTreatedUser = {
	user: 0
};

// Server
var server = http.createServer(function (req, res) {
	var urlReq = url.parse(req.url).pathname;
	
	// Justify the text
	if(urlReq == '/api/justify'){
		var token = req.headers.cookie;
		// User not signed in
		if(!token){
			res.writeHead(401,{'Content-Type': 'text/html'});
			res.end("Erreur 401: non identifié");
		}
		// Limit number of words treated reached
		else if(numberOfWordsTreatedUser['user'] >= numberOfWordsMax){
			res.writeHead(402,{'Content-Type': 'text/html'});
			res.end("Erreur 402: Payement Required");
		}
		else{
			var input = url.parse(req.url, true).query.input;
			res.writeHead(200, {'Content-Type': 'text/plain'});
			var inputParList = input.split('\n');
			var output = "";
			var lineLength = -1;
			var wordsOfNewLine = [];
			
			// Browsing paragraph list
			for(var numPar in inputParList){
				var inputWordList = inputParList[numPar].split(' ');
				// Browsing words list of the selected paragraph
				for(var indexWord in inputWordList){
					numberOfWordsTreatedUser['user'] += 1
					word = inputWordList[indexWord];
					// Enough place for the new word
					if(lineLength + 1 + word.length <= numberOfCharacterPerLine){
						lineLength += 1 + word.length;
						wordsOfNewLine.push(word);
					}
					// Need new line for the new word
					else{
						// Build new line of the input
						spaceMissing = numberOfCharacterPerLine - lineLength;
						for(var w in wordsOfNewLine){
							output += wordsOfNewLine[w];
							if(w != wordsOfNewLine.length -1){
								// Number of spaces after all the words of the line
								numberOfSpaces = 1 + Math.floor(spaceMissing/(wordsOfNewLine.length-1));
								// If still space missing to reach 80, then symetrical division
								if((spaceMissing%(wordsOfNewLine.length-1) == 1 && w==0)
									|| w<Math.ceil(spaceMissing%(wordsOfNewLine.length-1)/2)
									|| w>=(wordsOfNewLine.length-1-Math.floor(spaceMissing%(wordsOfNewLine.length-1)/2))){
									output += "&nbsp;";
								}
								for(var i=0;i<numberOfSpaces;i++){
									output += "&nbsp;";
								}
							}
						}
						output += "<br>";
						
						// Set to null the variables for new line
						wordsOfNewLine = [word];
						lineLength = word.length;
					}
				}
				// Build last line of the paragraph
				for(var w in wordsOfNewLine){
					output += wordsOfNewLine[w] + ' ';
				}
				
				output += "<br>";
				
				// Set to null the variables for new paragraph
				spaceMissing = 0;
				wordsOfNewLine = [];
				lineLength = -1;
			}
			
			// Build last line of the output
			for(var w in wordsOfNewLine){
				output += wordsOfNewLine[w] + ' ';
			}
			
			res.end(JSON.stringify({justifiedText: output, numberOfWords: numberOfWordsTreatedUser['user']}));
		}
	}
	
	
	// Authentification with token
	else if(urlReq == '/api/token'){
		var email = url.parse(req.url, true).query.email;
		// Input not valid
		if( !email || validUsers['user'] != email){
			res.writeHead(401,{'Content-Type': 'text/html'});
			res.end("Erreur 401: Email non valide");
		}
		// Known user
		else{
			const token = jwt.sign({email},jwtKey,{
				algorithm: "HS256",
				expiresIn : jwtExpirySeconds,
			})
			
			res.writeHead(200,{'Set-Cookie': token, 'Content-Type': 'text/html'});
			res.end()
		}
	}
	
	
	else{
		res.writeHead(200, {'Content-Type': 'text/html'});
        fs.readFile('tictactrip-HTML.html',function (err,data) {res.end(data);});
	}
}).listen(1337, '127.0.0.1');

console.log('Server running at http://127.0.0.1:1337/');
