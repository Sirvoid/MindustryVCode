module.exports.parse = (operationStr, varName) => {

	operationStr = operationStr.replace(/\s/g, '');
	let operationArr = [];

	let opPre = {
		'^': { pre: 4, asc: 'right', code: 'pow'},
		'*': { pre: 3, asc: 'left', code: 'mul'},
		'/': { pre: 3, asc: 'left', code: 'div'},
		'//': { pre: 3, asc: 'left', code: 'idiv'},
		'%': { pre: 3, asc: 'left', code: 'mod'},
		'<': { pre: 2, asc: 'left'},
		'>': { pre: 2, asc: 'left'},
		'<<': { pre: 2, asc: 'left', code: 'shl'},
		'>>': { pre: 2, asc: 'left', code: 'shr'},
		'|': { pre: 2, asc: 'left', code: 'or'},
		'&': { pre: 2, asc: 'left', code: 'and'},
		'+': { pre: 2, asc: 'left', code: 'add'},
		'-': { pre: 2, asc: 'left', code: 'sub'}
	};

	let fnc = {
		'sin': 1,
		'cos': 1,
		'tan': 1,
		'sqrt': 1,
		'floor': 1,
		'ceil': 1,
		'round': 1,
		'max': 2,
		'min': 2
	};

	let tokenToAdd = '';
	for(let i = 0; i < operationStr.length; i++) {
		let chara = operationStr[i];
		let nextChara = operationStr[i + 1];
		let prevChara = operationStr[i - 1];
	
		tokenToAdd += chara;
		
		if(chara == '-' && i == 0) continue;
		if(chara == '-' && (opPre[prevChara] || prevChara == '(')) continue;
		
		if(nextChara == '-') {
			operationArr.push(tokenToAdd);
			tokenToAdd = '';
			continue;
		}
		
		if(chara == '(' || chara == ')' || chara == ',' || nextChara == ',') {
			operationArr.push(tokenToAdd);
			tokenToAdd = '';
		} else if(fnc[tokenToAdd] && nextChara == '(') {
			operationArr.push(tokenToAdd);
			tokenToAdd = '';
		} else if(opPre[tokenToAdd] && nextChara == '(') {
			operationArr.push(tokenToAdd);
			tokenToAdd = '';
		} else if(opPre[nextChara] && !opPre[chara]) {
			operationArr.push(tokenToAdd);
			tokenToAdd = '';
		} else if(opPre[chara] && !opPre[nextChara]) {
			operationArr.push(tokenToAdd);
			tokenToAdd = '';
		} else if(nextChara == '(' || nextChara == ')') {
			operationArr.push(tokenToAdd);
			tokenToAdd = '';
		}
		
	}

	if(tokenToAdd) operationArr.push(tokenToAdd);

	let opStack = [];
	let output = [];

	for(let i = 0; i < operationArr.length; i++) {
		let token = operationArr[i];
		let number = parseFloat(token) || (!opPre[token] && !fnc[token] && token != '(' && token != ')');
		
		if(token == ',') continue;
		
		if(opPre[token]) {
			while(
				opStack[0] && 
				opPre[token] &&
				opStack[0] != '(' && 
				(opPre[opStack[0]].pre > opPre[token].pre || (opPre[opStack[0]].pre == opPre[token].pre && opPre[token].asc == 'left'))
			) {
				output.push(opStack.shift());
			}
			opStack.unshift(token);
		} else if(number) {
			output.push(token);
		} else if(token == '(') {
			opStack.unshift(token);
		} else if(token == ')') {
			while(opStack[0] != '(') {
				output.push(opStack.shift());
			}
			if(opStack[0] == '(') {
				opStack.shift();
			} 
			if(fnc[opStack[0]]) {
				output.push(opStack.shift());
			}
		} else {
			opStack.unshift(token);
		}
		
	}

	while(opStack[0]) {
		output.push(opStack.shift());
	}

	let ops = [];

	let vCnt = 0;

	while(output[1]) {
		for(let i = 0; i < output.length; i++) {
			let token = output[i];
			let isNumberOrVar = parseFloat(token) || (!opPre[token] && !fnc[token] && token != '(' && token != ')');
			if(!isNumberOrVar) {
				let tempVar = '_TEMP_OP_' + ++vCnt;
				
				let nbParams = fnc[token] || 2;
				
				let strOp = 'op ' + (opPre[token] ? opPre[token].code : token) + ' ' + tempVar;
				
				for(let j = nbParams; j > 0; j--) {
					strOp += ' ' + output[i - j];
				}
				
				ops.push(strOp);
				output.splice(i - nbParams, 1 + nbParams, tempVar);
				break;
			}
		}
	}

	if(ops.length == 0) {
		ops.push('set ' + varName + ' ' + operationStr);
	} else {
		ops[ops.length - 1] = ops[ops.length - 1].replace('_TEMP_OP_' + vCnt, varName);
	}
	
	return ops;
};