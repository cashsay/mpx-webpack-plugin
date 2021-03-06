const Module = require("webpack/lib/Module");
const Template = require("webpack/lib/Template");
const { RawSource } = require("webpack-sources");
const path = require("path");

module.exports = class MPXMultiModule extends Module {
    constructor({ context, name, request, userRequest, metadata, dependencies }) {
        super("javascript/dynamic", context);
		
		this.name = name;
		this.request = request;
		this.metadata = metadata;
		this.dependencies = dependencies;
		this.contextDependencies = new Set([this.context]);
    }
    
    identifier() {
        return "miniprogram multi module " + this.request;
    }
    
    readableIdentifier( requestShortener ) {
        return "miniprogram multi module " + requestShortener.shorten(this.request);
    }
    
	build(options, compilation, resolver, fs, callback) {
		this.built = true;
		this.buildMeta = {};
		this.buildInfo = {
			builtTime: Date.now(),
			contextDependencies: this.contextDependencies
		};
		return callback();
	}
    
    size() {
		return 16 + this.dependencies.length * 12;
	}

	updateHash( hash ) {
		hash.update("miniprogram multi module");
		hash.update(this.name || "");
		hash.update(this.metadata && this.metadata.kind || "");
		super.updateHash(hash);
    }
    
    needRebuild( fileTimestamps, contextTimestamps ) {
		const ts = contextTimestamps.get(this.context);
		
		if (!ts) {
			return true;
		}

		return ts >= this.buildInfo.builtTime;
	}

	source( dependencyTemplates, runtimeTemplate ) {
		const str = [];
		let idx = 0;
		for (const dep of this.dependencies) {
			if (dep.module) {
				if (idx === this.dependencies.length - 1) str.push("module.exports = ");
				str.push("__webpack_require__(");
				if (runtimeTemplate.outputOptions.pathinfo)
					str.push(Template.toComment(dep.request));
				str.push(`${JSON.stringify(dep.module.id)}`);
				str.push(")");
			} else {
				const content = require("./dependencies/WebpackMissingModule").module(
					dep.request
				);
				str.push(content);
			}
			str.push(";\n");
			idx++;
		}
		return new RawSource(str.join(""));
	}
}