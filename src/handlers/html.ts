import { log } from "../utils";

function findHtmlTagContentsRecursive(content: string, targetTag: string, targetClass: string | null = null, foundTagContents: string[] = [], deep: number = 0, maxDeep: number = -1) {
    let contentAfterTag = content;
    const startTagWithClassRegexStr = targetClass ?
        // ref: https://stackoverflow.com/a/16559544
        `(<\\w+?\\s+?class\\s*=\\s*['\"][^'\"]*?\\b${targetClass}\\b)`
        : "";
    const startTagRegexStr = `(<${targetTag}[\\s|>])`;
    const endTagRegexStr = `(<\/${targetTag}>)`;

    // clear content before the start tag
    const clearContentBeforeStartTagRegex = new RegExp(`${startTagWithClassRegexStr ? startTagWithClassRegexStr + ".*|" + startTagRegexStr : startTagRegexStr + ".*"}`, "i");
    const contentAfterStartTagMatch = contentAfterTag.match(clearContentBeforeStartTagRegex);
    if (contentAfterStartTagMatch) {
        contentAfterTag = contentAfterStartTagMatch[0];
    }

    let endTagCont = 0;

    const endTagContRegex = new RegExp(endTagRegexStr, "gi");
    const endTagContMatch = contentAfterTag.match(endTagContRegex);
    if (endTagContMatch) {
        endTagCont = endTagContMatch.length;
    }

    let closeTagPoition = 0;

    const tagPatternRegex = new RegExp(`${startTagWithClassRegexStr ? startTagWithClassRegexStr + "|" + startTagRegexStr : startTagRegexStr}|${endTagRegexStr}`, "gi");
    const tagPatternMatch = contentAfterTag.match(tagPatternRegex);
    if (tagPatternMatch) {
        let tagCount = 0;
        let markedPosition = false;
        for (let i = 0; i < tagPatternMatch.length; i++) {
            if (tagPatternMatch[i].startsWith("</")) {
                if (!markedPosition) {
                    closeTagPoition = endTagCont - tagCount;
                    markedPosition = true;
                }
                tagCount--;
            } else {
                tagCount++;
            }
            if (tagCount == 0) {
                break;
            }
        };
    }

    // match the last html end tag of all content and all content before it
    const tagEndRegex = new RegExp(`(.*)${endTagRegexStr}`, "i");

    for (let i = 0; i < closeTagPoition; i++) {
        const tagCloseMatch = contentAfterTag.match(tagEndRegex);
        if (tagCloseMatch) {
            contentAfterTag = tagCloseMatch[1];
        }
    }

    const clearContentAfterCloseTagRegex = new RegExp(`.*${endTagRegexStr}`, "i");
    const clearContentAfterCloseTagMatch = contentAfterTag.match(clearContentAfterCloseTagRegex);
    if (clearContentAfterCloseTagMatch) {
        contentAfterTag = clearContentAfterCloseTagMatch[0];
        foundTagContents.push(contentAfterTag);
    }

    // replace the contentAfterTag in content with ""
    // only replace the first match
    const remainingHtmlRegex = new RegExp(contentAfterTag.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + "(.*)", "i");
    const remainingHtmlMatch = content.match(remainingHtmlRegex);
    if (remainingHtmlMatch) {
        const remainingHtml = remainingHtmlMatch[1];
        // check if any html tag is left
        const remainingHtmlTagRegex = new RegExp(`(<\\w+?>)`, "i");
        const remainingHtmlTagMatch = remainingHtml.match(remainingHtmlTagRegex);
        if (remainingHtmlTagMatch) {
            if (maxDeep === -1 || deep < maxDeep) {
                return findHtmlTagContentsRecursive(remainingHtml, targetTag, targetClass, foundTagContents, deep + 1, maxDeep);
            } else {
                log("warn", "HTML search:", "Max deep reached, recursive break");
                return foundTagContents;
            }
        }
    }

    return foundTagContents;
}
function findHtmlTagContents(content: string, targetTag: string, targetClass: string | null = null) {
    return findHtmlTagContentsRecursive(content, targetTag, targetClass);
}

function findHtmlTagContentsByClass(content: string, targetClass: string) {
    const regex = new RegExp(`(<(\\w+)\\s+class\\s*=\\s*['\"][^'\"]*?\\b${targetClass}\\b)`, "i");
    const match = content.match(regex);
    if (match) {
        const tag = match[2];
        return findHtmlTagContents(content, tag, targetClass);
    } else {
        return [];
    }
}

export {
    findHtmlTagContents,
    findHtmlTagContentsByClass,
}