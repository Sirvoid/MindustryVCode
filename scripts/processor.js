const compiler = require('compiler');

global.override.block(LogicBlock, {
	buildConfiguration(t){
		this.super$buildConfiguration(t);
		t.row();
		t.button(Icon.upload, Styles.clearTransi, () => {

			const dialog = new BaseDialog('VCode Compiler');
			const input = new TextArea('');
			
			dialog.addCloseButton();
			dialog.cont.add(input);
			dialog.cont.row();
			
			const compileBtn = dialog.cont.button('Compile', () => {

				let compiled = compiler.compile(input.text);
				
				if(compiled.code != '') {
					this.updateCode(compiled.code);
				} else {
					const errorD = new BaseDialog('Compilation Error');
					errorD.addCloseButton();
					errorD.cont.add('Error: ');
					errorD.cont.row();
					errorD.cont.add(compiled.error);
					errorD.show();
				}
				
			});
			
			compileBtn.size(240, 40);
			dialog.cont.row();
			dialog.cont.add('**Require 1 memory cell for functions.');
			
			dialog.show();
		});
	}
});