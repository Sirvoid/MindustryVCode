const opParser = require('operationParser');

let curLineI;
let curLine;
let curScope;

const getLineParam = (curLine) => {
	let lineArr = curLine.split(' ');
	lineArr.shift();
	return lineArr.join(' ').trim();
};

const parse = (code) => {
	
	let ast = [{
		parent: null, 
		funcName: '___program', 
		content: [],
		i:-1
	}];
	
	curScope = ast[0];
	
	for(let lineI in code) {
		let line = code[lineI];
		
		curLineI = lineI;
		curLine = line.trim();
		if(curLine == '') continue;
		
		let token = curLine.split(' ')[0].toLowerCase();
		if(token in tokenFunc) { 
			tokenFunc[token]();
		} else {
			parseVar();
		}
	}
	
	return ast;
};

const parseCmd = () => {
	let command = getLineParam(curLine);
	curScope.content.push({command: command});
};

const parseWhile = () => {
	parseCondition('while');
};

const parseIf = () => {
	parseCondition('if');
};

const parseCondition = (type) => {
	let condition = getLineParam(curLine);
	let curOp = '';
	
	let operations = opParser.parse(condition, '__condition_result');
	
	let newScope = {
		parent: curScope,
		conditionType: type, 
		operations:operations, 
		content: [],
		i:-1
	};
	
	curScope.content.push(newScope);
	curScope = newScope;
};

const parseBreak = () => {
	curScope.content.push({'break': 'break'});
};

const parseContinue = () => {
	curScope.content.push({'continue': 'continue'});
};

const parseReturn = () => {
	curScope.content.push({'return': 'return'});
};

const parseCall = () => {
	let funcName = getLineParam(curLine);
	curScope.content.push({call: funcName});
};

const parseFunc = () => {
	let funcName = getLineParam(curLine);
	if(funcName) {
		let newScope = {
			parent: curScope, 
			funcName: funcName, 
			content: [],
			i:-1
		};
		curScope.content.push(newScope);
		curScope = newScope;
	}
};

const parseEnd = () => {
	curScope.content.push({end: 'end'});
	curScope = curScope.parent;
};

const parseVar = () => {
	let expressions = curLine.split('=');
	let varName = expressions.shift().trim();
	let mathExp = expressions.join('=');
	
	let operations = opParser.parse(mathExp, varName);

	curScope.content.push({
		varName: varName, 
		operations: operations
	});
	
};

const tokenFunc = {
	'func': parseFunc,
	'end': parseEnd,
	'cmd': parseCmd,
	'call': parseCall,
	'if': parseIf,
	'while': parseWhile,
	'break': parseBreak,
	'continue': parseContinue,
	'return': parseReturn
};

module.exports.parse = parse;
module.exports.infos = () => { return {line:curLine, lineI:curLineI}; };