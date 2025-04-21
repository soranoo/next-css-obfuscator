import type { SelectorConversion } from "../types";

import * as htmlparser2 from "htmlparser2";
import { escape as htmlEscape } from "html-escaper";
import { obfuscateKeys } from "../utils";
import { obfuscateJs } from "./js";
import { cssUnescape } from "css-seasoning";

export const obfuscateHtmlClassNames = ({
	html,
	selectorConversion,
	obfuscateMarkerClass = "",
	contentIgnoreRegexes = [],
}: {
	html: string;
	selectorConversion: SelectorConversion;
	obfuscateMarkerClass?: string;
	contentIgnoreRegexes?: RegExp[];
}) => {
	const voidTags = [
		"area",
		"base",
		"br",
		"col",
		"command",
		"embed",
		"hr",
		"img",
		"input",
		"keygen",
		"link",
		"meta",
		"param",
		"source",
		"track",
		"wbr",
	];

	let modifiedHtml = "";
	let insideObsClassScope = false;
	let ObsClassScopeTagCount = 0; // Count of the obfuscate class scope tag (for nested tags with the same class name)
	let ObsClassScopeTag = "";

	let scriptContent = "";
	let isScriptTag = false;

	const usedKeys: string[] = [];

	const parser = new htmlparser2.Parser(
		{
			onprocessinginstruction(name, data) {
				modifiedHtml += `<${data}>`;
			},
			onopentag(tagName, attribs) {
				if (tagName === "script") {
					isScriptTag = true;
					scriptContent = ""; // reset script content for a new script tag
				}

				if (attribs.class) {
					// Check if the current tag is within the scope of the obfuscate class
					if (
						!insideObsClassScope &&
						obfuscateMarkerClass &&
						attribs.class.includes(obfuscateMarkerClass)
					) {
						insideObsClassScope = true;
						ObsClassScopeTag = tagName;
					}

					if (insideObsClassScope || !obfuscateMarkerClass) {
						const { obfuscatedContent, usedKeys: _usedKeys } = obfuscateKeys(
							selectorConversion,
							attribs.class,
							[],
							true,
						);
						usedKeys.push(..._usedKeys);
						// Update the class to the modified class names
						attribs.class = obfuscatedContent;
					}
				}

				if (insideObsClassScope && tagName === ObsClassScopeTag) {
					ObsClassScopeTagCount++;
				}

				// Reconstruct the tag with the modified class names
				modifiedHtml += `<${tagName}`;
				for (const key in attribs) {
					// modifiedHtml += ` ${key}="${attribs[key]}"`;
          modifiedHtml += ` ${key}="${htmlEscape(attribs[key])}"`;
				}
				if (voidTags.includes(tagName)) {
					modifiedHtml += " />";
				} else {
					modifiedHtml += ">";
				}
			},
			oncomment(comment) {
				modifiedHtml += `<!--${comment}-->`;
			},
			ontext(text) {
				if (isScriptTag) {
					scriptContent += text;
				} else {
					modifiedHtml += text;
				}
			},
			onclosetag(tagname) {
				if (voidTags.includes(tagname)) {
					return;
				}

				if (tagname === "script" && isScriptTag) {
					isScriptTag = false;
					let obfuscatedScriptContent = scriptContent;
					Object.keys(selectorConversion).forEach((key) => {
						const className = cssUnescape(key).slice(1);
						const obfuscatedJs = obfuscateJs(
							obfuscatedScriptContent,
							className,
							{ [key]: selectorConversion[key] },
							"{a HTML file path}",
							contentIgnoreRegexes,
						);
						if (obfuscatedJs !== obfuscatedScriptContent) {
							obfuscatedScriptContent = obfuscatedJs;
							usedKeys.push(key);
						}
					});
					modifiedHtml += `${obfuscatedScriptContent}`;
				}
				modifiedHtml += `</${tagname}>`;

				if (insideObsClassScope && tagname === ObsClassScopeTag) {
					ObsClassScopeTagCount--;
				}

				if (ObsClassScopeTagCount === 0) {
					insideObsClassScope = false;
				}
			},
		},
		{ decodeEntities: true },
	);

	parser.write(html);
	parser.end();

	return {
		obfuscatedContent: modifiedHtml,
		usedKeys: Array.from(new Set(usedKeys)),
	};
}
