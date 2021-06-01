let code;
let curScope;
let readContent;
let conditionMem;
let conditionCnt;
let funcCnt;

const assemble = (ast) => {

	curScope = ast[0];
	conditionMem = {'if':[],'while':[]};
	conditionCnt = 0;
	funcCnt = 0;
	code = [];
	
	do {
	
		curScope.i++;
		for(let token in tokenFunc) {
			readContent = curScope.content[curScope.i];
			if(curScope.i >= curScope.content.length) break;
			if(token in readContent) {
				tokenFunc[token]();
				break;
			}
		}
		
		if(curScope.i >= curScope.content.length) break;
	} while(true)
	
	code.push('end');
	return code.join('\n');
};

const funcAsm = () => {
	code.push('jump __endf_' + funcCnt + ' always');
	code.push('__' + readContent.funcName + ':');
	curScope = readContent;
};

const conditionAsm = () => {
	let type = readContent.conditionType;
	let conMem = conditionMem[type];
	
	conMem.push(++conditionCnt);
	
	if(type == 'while') {
		code.push('__' + type + 's_' + conditionCnt + ':');
	}
	
	code = code.concat(readContent.operations);
	
	code.push('jump ' + '__' + type + 'n_' + conditionCnt + ' equal __condition_result false');
	
	curScope = readContent;
};

const endAsm = () => {

	if('conditionType' in curScope) {
		let type = curScope.conditionType;
		
		let conMem = conditionMem[type];
		
		let conditionCode = conMem[conMem.length - 1];
		conMem.splice(conMem.length - 1, 1);
		
		if(curScope.conditionType == 'while') {
			code.push('jump ' + '__' + type + 's_' + conditionCode + ' always');
		}
		
		code.push('__' + type + 'n_' + conditionCode + ':');
	} else if('funcName' in curScope) {
		code.push(
			'__returnf_' + funcCnt + ':',
			'op sub __retCount __retCount 1',
			'read __retAddr cell1 __retCount',
			'set @counter __retAddr',
			'__endf_' + funcCnt + ':'
		);
		
		funcCnt++;
	}
	curScope = curScope.parent;
};

const breakAsm = () => {
	let type = 'while';
	let conMem = conditionMem[type];
	let conditionCode = conMem[conMem.length - 1];
	code.push('jump ' + '__' + type + 'n_' + conditionCode + ' always');
};

const continueAsm = () => {
	let type = 'while';
	let conMem = conditionMem[type];
	let conditionCode = conMem[conMem.length - 1];
	code.push('jump ' + '__' + type + 's_' + conditionCode + ' always');
};

const returnAsm = () => {
	code.push('jump ' + '__returnf_' + funcCnt + ' always');
};

const cmdAsm = () => {
	code.push(readContent.command);
};

const callAsm = () => {
	code.push(
		'op add __retAddr @counter 3',
		'write __retAddr cell1 __retCount',
		'op add __retCount __retCount 1',
		'jump __' + readContent.call + ' always'
	);
};

const varAsm = () => {
	let operations = readContent.operations;
	code = code.concat(operations);
};

const tokenFunc = {
	'funcName' : funcAsm,
	'conditionType' : conditionAsm,
	'call' : callAsm,
	'varName' : varAsm,
	'command' : cmdAsm,
	'end' : endAsm,
	'break' : breakAsm,
	'continue': continueAsm,
	'return': returnAsm
};

module.exports.assemble = assemble;