const opParser = require('operationParser');

let curLineI;
let curLine;
let curScope;

const conditionCode = {
	'===': 'strictEqual', 
	'==': 'equal', 
	'<=': 'lessThanEq', 
	'>=': 'greaterThanEq', 
	'<': 'lessThan', 
	'>': 'greaterThan', 
	'!=': 'notEqual'
};

const parse = (code) => {
	
	let ast = [{
		parent: null, 
		funcName: '_program', 
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
	let command = curLine.replace('cmd ', '').trim();
	curScope.content.push({command: command});
};

const parseWhile = () => {
	parseCondition('while');
};

const parseIf = () => {
	parseCondition('if');
};

const parseCondition = (type) => {
	let condition = curLine.replace(type + ' ', '').trim();
	let curOp = '';
	
	for(let op in conditionCode) {
		let indexOp = condition.indexOf(op);
		if(indexOp != -1) {
			curOp = op;
			break;
		}
	}
	
	let values = condition.split(curOp);
	let val1 = values[0].trim();
	let val2 = values[1].trim();
	
	let newScope = {
		parent: curScope,
		conditionType: type, 
		condition:[conditionCode[curOp], val1, val2], 
		content: [],
		i:-1
	};
	
	curScope.content.push(newScope);
	curScope = newScope;
};

const parseBreak = () => {
	curScope.content.push({'break': 'break'});
};

const parseCall = () => {
	let funcName = curLine.replace('call ', '').trim();
	curScope.content.push({call: funcName});
};

const parseFunc = () => {
	let funcName = curLine.replace('func ', '').trim();
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
	let varName = expressions.shift();
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
	'break': parseBreak
};

module.exports.parse = parse;
module.exports.infos = () => { return {line:curLine, lineI:curLineI}; };