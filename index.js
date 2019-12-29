
const fs = require('fs');

var sAPSFileContent = fs.readFileSync('./demo/automated_page_scraper_demo.aps').toString();

var aLines = sAPSFileContent.split('\n');

var bIsOptions = false;
var bIsProgStart = false;
var bIsPageToOpen = false; 
var bIsPageEvent = false;
var sPageToOpenUrl = '';

var oEmptyLineRegExp = /^\s*$/;
var oOptionsRegExp = /^@options\s*$/;
var oParseParameterRegExp = /^(?<indent>\s+)(?<name>\w+):\s*(?<value>\w+)\s*$/;
var oPageToOpenURLRegExp = /^(?<url>https?.*?)(?<params>\s+@\w+)*$/;
var oOnPageOpenEventRegExp = /^@on\s+(?<url>https?.*?)(?<params>\s+@\w+)*$/;
var oSelectorRegExp = /^(?<indent>\s+)(?<selector>[\w\d\s%()\[\]><^&*#$~!=.-])(\s+["'](?<name>.*?)["'])?(\s+>\s+["'](?<file_path>.*?)["'])?.*?$/;

//var iLevel = 0;
var oOptions = {

};

var aPagesToOpen = [];
var aOnPageOpenEvents = [];
var aSelectionsStack = [];
//var aResultTree = [];

function fnThrowError(sMessage)
{
    throw new Error(`[E] Line: ${iLineNumber} - ${sMessage}`);
}

function fnAddComponent(sType, oGroups)
{
    var iLevel = 0;
    if (oGroups.indent) {
        if (oGroups.indent % 4) {
            fnThrowError(`wrong indent level`);
        }
        iLevel = oGroups.indent / 4;
    }
    if (iLevel<aSelectionsStack.length) {
        aSelectionsStack = aSelectionsStack.slice(0, iLevel)
    }
    if (sType=="open_url") {
        var oItem = {
            sType: sType,
            sURL: oGroups.url,
            aChildren: []
        };

        aPagesToOpen.push(oItem);
        aSelectionsStack.push(oItem);
    }
    if (sType=="selector") {
        if (!aSelectionsStack[0] || aSelectionsStack[0].sType!="open_url") {
            fnThrowError(`selector without page`);
        }
        
        var oItem = {
            sType: sType,
            sURL: oGroups.url,
            sSelector: oGroups.selector,
            aChildren: []
        };

        aSelectionsStack[aSelectionsStack.length-1].aChildren.push(oItem);
        aSelectionsStack.push(oItem);
    }
}

for (var iLineNumber=0; iLineNumber<aLines.length; iLineNumber++) {
    global.iLineNumber = iLineNumber;
    var sLine = aLines[iLineNumber];

    if (oEmptyLineRegExp.test(sLine)) {
        continue;
    }

    if (oOptionsRegExp.test(sLine) && bIsProgStart) {
        fnThrowError(`options must be before program`);
    }
    
    if (oOptionsRegExp.test(sLine)) {
        bIsOptions = true;
        continue;
    }

    if (bIsOptions) {
        if (!oParseParameterRegExp.test(sLine)) {
            bIsOptions = false;
        } else {
            var oGroups = sLine.match(oParseParameterRegExp).groups;
            if (oGroups.indent.length!=4) {
                fnThrowError(`wrong indent, 4 spaces required`);
            }
            oOptions[oGroups.name] = oGroups.value;
            continue;
        }
    }

    bIsProgStart = true;

    if (oPageToOpenURLRegExp.test(sLine)) {
        bIsPageToOpen = true;
        bIsPageEvent = false;
        var oGroups = sLine.match(oPageToOpenURLRegExp).groups;
        fnAddComponent("open_url", oGroups);
        continue;
    }

    if (oOnPageOpenEventRegExp.test(sLine)) {
        bIsPageToOpen = false;
        bIsPageEvent = true;
        var oGroups = sLine.match(oParseParameterRegExp).groups;
        fnAddComponent("on_open_page", oGroups);
        continue;
    }

    if (oPageToOpenURLRegExp.test(sLine)) {
        bIsPageToOpen = true;
        bIsPageEvent = false;
        var oGroups = sLine.match(oPageToOpenURLRegExp).groups;
        fnAddComponent("open_url", oGroups);
        continue;
    }
}

console.log(oOptions);