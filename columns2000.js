﻿/**
 * @preserve Columns 2000
 * 2012 https://github.com/judas-christ/columns2000
 * Adapted to jQuery 1.8 from CSS3MultiColumn 1.02 beta, copyright (c) 2005 Cdric Savarese <pro@4213miles.com> licensed under the CC-GNU LGPL <http://creativecommons.org/licenses/LGPL/2.1/>
 */

// CSS3MultiColumn - a javascript implementation of the CSS3 multi-column module
// v1.02 beta - Jan 08 2008
// Copyright (c) 2005 Cdric Savarese <pro@4213miles.com>
// This software is licensed under the CC-GNU LGPL <http://creativecommons.org/licenses/LGPL/2.1/>

// For additional information, see : http://www.csscripting.com/

// Supported Properties: 
// column-count 
// column-width	
// column-gap
// column-rule

// Unsupported Properties: 
// column-rule-width (use column-rule instead)
// column-rule-style (use column-rule instead)
// column-rule-color (use column-rule instead)
// column-span
// column-width-policy
// column-space-distribution

(function ($, window, document) {
    'use strict';
    function CSS3MultiColumn() {
        var cssCache = {};
        var splitableTags = ['P', 'DIV', 'SPAN', 'BLOCKQUOTE', 'ADDRESS', 'PRE', 'A', 'EM', 'I', 'STRONG', 'B', 'CITE', 'OL', 'UL', 'LI'];
        var pseudoCSSRules = {};
        var ut = new CSS3Utility();

        var isDebug = false;

        var bestSplitPoint = null;
        var secondSplitPoint = null;
        var secondSplitBottom = 0;

        // INITIALIZATION
        var promises = [];
        loadStylesheets(promises);
        $.when.apply(null, promises).done(processElements);

        // CSS PARSING
        // --------------------------------------------------------------------------------------
        // loadStylesheets: 
        // Loop through the stylesheets collection and load the css text into the cssCache object	
        function loadStylesheets(promises) {
            var promise;
            if (document.styleSheets) {	// Firefox & IE
                // load css
                for (var i = 0; i < document.styleSheets.length; i++) {
                    promise = loadCssCache(document.styleSheets[i]);
                    if(promise)
                        promises.push(promise);
                }
            } else if (document.getElementsByTagName) { // OPERA
                var Lt = document.getElementsByTagName('link');
                // load css
                for (var i = 0; i < Lt.length; i++) {
                    promise = loadCssCache(loadCssCache(Lt[i]));
                    if (promise)
                        promises.push(promise);
                }
            }
        }

        // loadCssCache
        // Asynchronous function. Call the 'callback' function when done.
        function loadCssCache(s) {
            if (s.href && s.cssText) {
                parseStylesheet(s.cssText);
                return new $.Deferred().resolve().promise();
            } else if (s.href) {
                var deferred = new $.Deferred();
                $.get(s.href)
                    .done(function (data) {
                        parseStylesheet(data);
                        deferred.resolve();
                    });
                return deferred.promise();
            }
        }

        // parseStylesheet:
        // Loads the pseudoCSSRules object with the values for column-count, column-width, column-gap... 
        function parseStylesheet(cssText) {

            // Retrieving column-count property
            var cc = new ut.getPseudoCssRules('column-count', cssText);
            for (var i = 0; cc && i < cc.cssRules.length; i++) {
                if (!pseudoCSSRules[cc.cssRules[i].selectorText])
                    pseudoCSSRules[cc.cssRules[i].selectorText] = {};
                pseudoCSSRules[cc.cssRules[i].selectorText]['column-count'] = cc.cssRules[i].value;
            }
            // Retrieving column-width property
            cc = new ut.getPseudoCssRules('column-width', cssText);
            for (var i = 0; cc && i < cc.cssRules.length; i++) {
                if (!pseudoCSSRules[cc.cssRules[i].selectorText])
                    pseudoCSSRules[cc.cssRules[i].selectorText] = {};
                pseudoCSSRules[cc.cssRules[i].selectorText]['column-width'] = cc.cssRules[i].value;
            }
            // Retrieving column-gap property
            cc = new ut.getPseudoCssRules('column-gap', cssText);
            for (var i = 0; cc && i < cc.cssRules.length; i++) {
                if (!pseudoCSSRules[cc.cssRules[i].selectorText])
                    pseudoCSSRules[cc.cssRules[i].selectorText] = {};
                pseudoCSSRules[cc.cssRules[i].selectorText]['column-gap'] = cc.cssRules[i].value;
            }
            // Retrieving column-rule property
            cc = new ut.getPseudoCssRules('column-rule', cssText);
            for (var i = 0; cc && i < cc.cssRules.length; i++) {
                if (!pseudoCSSRules[cc.cssRules[i].selectorText])
                    pseudoCSSRules[cc.cssRules[i].selectorText] = {};
                pseudoCSSRules[cc.cssRules[i].selectorText]['column-rule'] = cc.cssRules[i].value;
            }
        }

        // COLUMN PROCESSING 
        function processElements() {
            for (var i in pseudoCSSRules) {
                var affectedElements = $(i).map(function () { return this; });
                for (var j = 0; j < affectedElements.length; j++) {
                    processElement(affectedElements[j], pseudoCSSRules[i]['column-count'], pseudoCSSRules[i]['column-width'], pseudoCSSRules[i]['column-gap'], pseudoCSSRules[i]['column-rule']);
                }
            }
        }

        function processElement(affectedElement, column_count, column_width, column_gap, column_rule) {
            //affectedElement.style.visibility = 'hidden';
            var widthUnit;
            var width;
            var column_rule_width = 0;

            // Get available width
            // see http://www.csscripting.com/css-multi-column/dom-width-height.php
            // offsetWidth & scrollWidth are the only consistent values across browsers.
            // offsetWidth includes border, padding and scroll bars
            // scrollWidth includes border and padding
            // clientWidth when available includes padding only.
            // see http://msdn.microsoft.com/workshop/author/om/measuring.asp

            if (affectedElement.clientWidth && affectedElement.clientWidth != 0) {
                var padding;
                if (affectedElement.currentStyle) {
                    padding = parseInt(affectedElement.currentStyle.paddingLeft.replace(/[\D]*/gi, "")) + parseInt(affectedElement.currentStyle.paddingRight.replace(/[\D]*/gi, ""))
                } else if (document.defaultView && document.defaultView.getComputedStyle) {
                    padding = parseInt(document.defaultView.getComputedStyle(affectedElement, "").getPropertyValue("padding-left").replace(/[\D]*/gi, "")) + parseInt(document.defaultView.getComputedStyle(affectedElement, "").getPropertyValue("padding-left").replace(/[\D]*/gi, ""))
                    //padding = parseInt(window.getComputedStyle(affectedElement,"").getPropertyValue("padding-left").replace(/[\D]*/gi,"")) + parseInt(window.getComputedStyle(affectedElement,"").getPropertyValue("padding-left").replace(/[\D]*/gi,""))  
                }

                if (isNaN(padding)) padding = 0;
                width = (affectedElement.clientWidth - padding).toString() + "px";
            }
            else if (affectedElement.scrollWidth) {
                var borderWidth;
                var padding;

                if (affectedElement.currentStyle) {
                    padding = parseInt(affectedElement.currentStyle.paddingLeft.replace(/[\D]*/gi, "")) + parseInt(affectedElement.currentStyle.paddingRight.replace(/[\D]*/gi, ""))
                } else if (document.defaultView && document.defaultView.getComputedStyle) {
                    padding = parseInt(document.defaultView.getComputedStyle(affectedElement, "").getPropertyValue("padding-left").replace(/[\D]*/gi, "")) + parseInt(document.defaultView.getComputedStyle(affectedElement, "").getPropertyValue("padding-left").replace(/[\D]*/gi, ""))
                }

                if (isNaN(padding)) padding = 0;

                if (affectedElement.currentStyle) {
                    borderWidth = parseInt(affectedElement.currentStyle.borderLeftWidth.replace(/[\D]*/gi, "")) + parseInt(affectedElement.currentStyle.borderRightWidth.replace(/[\D]*/gi, ""))
                } else if (document.defaultView && document.defaultView.getComputedStyle) {
                    borderWidth = parseInt(document.defaultView.getComputedStyle(affectedElement, "").getPropertyValue("border-left-width").replace(/[\D]*/gi, "")) + parseInt(document.defaultView.getComputedStyle(affectedElement, "").getPropertyValue("border-right-width").replace(/[\D]*/gi, ""))
                }
                if (isNaN(borderWidth)) borderWidth = 0;

                width = (affectedElement.scrollWidth - padding - borderWidth).toString() + "px";
            }
            else width = "99%"; // ever used? 

            var availableWidth = parseInt(width.replace(/[\D]*/gi, ""));

            // Get width unit
            if (!column_width || column_width == 'auto')
                widthUnit = width.replace(/[\d]*/gi, "");
            else
                widthUnit = column_width.replace(/[\d]*/gi, "");
            if (!widthUnit)
                widthUnit = "px";

            if (!column_gap) { // Compute column spacing (column_gap)
                if (widthUnit == "%")
                    column_gap = 1; //%;
                else
                    column_gap = 15; //px;
            } else {
                column_gap = parseInt(column_gap.replace(/[\D]*/gi, ""));
            }
            if (column_rule && column_rule != 'none') {
                column_gap = Math.floor(column_gap / 2);
                // we add half the original column_gap to the column_rule_width to fix the column_width count below.
                column_rule_width = column_gap + parseInt(column_rule.substring(column_rule.search(/\d/), column_rule.search(/\D/)));
            }
            if (!column_width || column_width == 'auto') {// Compute columns' width 
                column_width = (availableWidth - ((column_gap + column_rule_width) * (column_count - 1))) / column_count;
            } else {
                column_width = parseInt(column_width.replace(/[\D]*/gi, ""))
                if (!column_count || column_count == 'auto') {// Compute column count
                    column_count = Math.floor(availableWidth / (column_width + column_gap));
                }
            }

            column_width -= 1;

            // Create a wrapper
            var wrapper = document.createElement('div'); //affectedElement.tagName
            var pn = affectedElement.parentNode;
            wrapper = pn.insertBefore(wrapper, affectedElement);
            var elem = pn.removeChild(affectedElement);
            elem = wrapper.appendChild(elem);
            //wrapper.style.border = "1px solid #F00";
            wrapper.className = elem.className;
            elem.className = "";
            // since all columns will be left-floating we need to clear the floats after them.
            //wrapper.style.overflow = 'auto';

            // Assign the content element a random Id ?
            elem.id = ut.randomId();

            // Adjust content's width and float the element 
            elem.style.width = column_width.toString() + widthUnit;
            //elem.style.padding = "0";
            //elem.style.margin = "0"; 

            if (typeof elem.style.styleFloat != 'undefined')
                elem.style.styleFloat = "left";
            if (typeof elem.style.cssFloat != 'undefined')
                elem.style.cssFloat = "left";

            // Compute Desired Height
            var newHeight = Math.floor(elem.offsetHeight / column_count) + 14;
            if (!wrapper.id) wrapper.id = ut.randomId();

            // Find split points (j is the max # of attempts to find a good height with no unsplittable element on the split point.
            var j = 1;
            for (var i = 1; i < column_count && elem && j < (column_count + 5) ; i++) {
                bestSplitPoint = null;
                secondSplitPoint = null;
                secondSplitBottom = 0;
                findSplitPoint(elem, newHeight * i, wrapper);

                if (isDebug) bestSplitPoint.style.border = "1px solid #00FF00";

                if (bestSplitPoint && !isElementSplitable(bestSplitPoint)) {

                    newHeight = getElementRelativeTop(bestSplitPoint, wrapper) + bestSplitPoint.offsetHeight + 10;
                    i = 1; // reset the height. Try again.
                }
                //else if (!bestSplitPoint) {
                //}

                j++;
            }

            
            for (var i = 1; i < column_count && elem; i++) {
                // Find the split point (a child element, sitting on the column split point)
                bestSplitPoint = null;
                secondSplitPoint = null;
                secondSplitBottom = 0;

                findSplitPoint(elem, newHeight, wrapper);
                if (bestSplitPoint && isElementSplitable(bestSplitPoint) && elem.id != bestSplitPoint.id) {
                    var splitE = bestSplitPoint;
                    if (isDebug) secondSplitPoint.style.border = "1px dotted #00F";
                }
                else {
                    var splitE = secondSplitPoint;
                }
                if (!splitE) {
                    return;
                }

                // DEBUG ONLY: SHOW SPLIT ELEMENT
                if (isDebug) splitE.style.border = "1px solid #F00";
                // END DEBUG ONLY: SHOW SPLIT ELEMENT

                // Create New Column	
                var newCol = elem.cloneNode(false);
                newCol.id = ut.randomId();

                // Insert new column in the document
                elem.parentNode.insertBefore(newCol, elem.nextSibling);

                // Add the column_gap
                newCol.style.paddingLeft = column_gap + widthUnit;

                // Add the column_rule
                if (column_rule && column_rule != 'none') {
                    newCol.style.borderLeft = column_rule;
                    elem.style.paddingRight = column_gap + widthUnit;
                }
                if (document.all && !window.opera)
                    elem.style.height = newHeight + 'px';
                elem.style.minHeight = newHeight + 'px';

                // Move all elements after the element to be splitted (splitE) to the new column
                var insertPoint = createNodeAncestors(splitE, elem, newCol, 'append');

                var refElement = splitE;
                while (refElement && refElement.id != elem.id) {
                    var littleSib = refElement.nextSibling;
                    while (littleSib) {
                        moveNode(littleSib, elem, newCol);
                        littleSib = refElement.nextSibling;
                    }
                    refElement = refElement.parentNode;
                }

                var strippedLine = splitElement(splitE, newHeight - getElementRelativeTop(splitE, wrapper), elem, newCol);

                // cleaning emptied elements
                var pn = splitE.parentNode;
                while (pn && pn.id != elem.id) {
                    var n = pn.firstChild;
                    while (n) {
                        if ((n.nodeType == 1 && n.childNodes.length == 0) ||
                            (n.nodeType == 3 && n.nodeValue.replace(/[\u0020\u0009\u000A]*/, '') == "")) {
                            pn.removeChild(n);
                            n = pn.firstChild;
                        } else {
                            n = n.nextSibling;
                        }
                    }
                    pn = pn.parentNode;
                }

                // if text-align is justified, insert &nbsp; to force the justify	
                if (strippedLine) {
                    splitE = elem.lastChild;
                    if (splitE && (document.defaultView && document.defaultView.getComputedStyle(splitE, '').getPropertyValue('text-align') == 'justify') ||
                       (splitE.currentStyle && splitE.currentStyle.textAlign == 'justify')) {
                        var txtFiller = document.createTextNode(' ' + strippedLine.replace(/./g, "\u00a0")); // &nbsp;
                        var filler = document.createElement('span');
                        splitE.appendChild(filler);
                        filler.style.lineHeight = "1px";
                        filler.appendChild(txtFiller);
                    }
                }
                // move on to split the newly added column
                elem = newCol;
            }
            if (elem) {//mainly to set the column rule at the right height.
                if (document.all && !window.opera)
                    elem.style.height = newHeight + 'px';
                elem.style.minHeight = newHeight + 'px';
            }

            var clearFloatDiv = document.createElement('div');
            clearFloatDiv.style.clear = "left";  // < bug in Safari 1.3 ? (duplicates content)
            clearFloatDiv.appendChild(document.createTextNode(' '));
            wrapper.appendChild(clearFloatDiv);
            if (navigator.userAgent.toLowerCase().indexOf('safari') + 1)
                wrapper.innerHTML += ' '; // forces redraw in safari and fixes bug above.

            //wrapper.style.visibility = 'visible'; 				
        }

        // Find the deepest splitable element that sits on the split point.
        function findSplitPoint(n, newHeight, wrapper) {
            if (n.nodeType == 1) {
                var top = getElementRelativeTop(n, wrapper);
                var bot = top + n.offsetHeight;
                if (top < newHeight && bot > newHeight) {
                    bestSplitPoint = n;
                    if (isElementSplitable(n)) {
                        for (var i = 0; i < n.childNodes.length; i++) {
                            findSplitPoint(n.childNodes[i], newHeight, wrapper);
                        }
                    }
                    return;
                }
                if (bot <= newHeight && bot >= secondSplitBottom) {
                    secondSplitBottom = bot;
                    secondSplitPoint = n;
                }
            }
            return;
        }

        function isElementSplitable(n) {
            if (n.tagName) {
                var tagName = n.tagName.toUpperCase();
                for (var i = 0; i < splitableTags.length; i++)
                    if (tagName == splitableTags[i]) return true;
            }
            return false;
        }

        function splitElement(n, targetHeight, col1, col2) {

            var cn = n.lastChild;
            while (cn) {
                // if the child node is a text node 			
                if (cn.nodeType == 3) {
                    var strippedText = "dummmy";
                    var allStrippedText = "";
                    // the +2 is for tweaking.. allowing lines to fit more easily
                    while (n.offsetHeight > targetHeight + 2 && strippedText != "") {
                        // remove lines of text until the splittable element reaches the targeted height or we run out of text.
                        strippedText = stripOneLine(cn);
                        allStrippedText = strippedText + allStrippedText;
                    }
                    if (allStrippedText != "") {
                        var insertPoint = createNodeAncestors(cn, col1, col2, 'insertBefore');
                        insertPoint.insertBefore(document.createTextNode(allStrippedText), insertPoint.firstChild);
                    }
                    if (cn.nodeValue == "") {
                        cn.parentNode.removeChild(cn);
                    }
                    else
                        break;
                }
                else {
                    // move element
                    var insertPoint = createNodeAncestors(cn, col1, col2, 'insertBefore');
                    insertPoint.insertBefore(cn.parentNode.removeChild(cn), insertPoint.firstChild);
                }
                cn = n.lastChild;
            }
            return strippedText; // returns the last line of text removed (used later for forcing the justification)
        }


        // stripOneLine()
        // This function removes exactly one line to
        // any element containing text
        // and returns the removed text as a string.
        function stripOneLine(n) {
            // get the text node
            while (n && n.nodeType != 3)
                n = n.firstChild;
            if (!n) return;

            // get the height of the element
            var e = n.parentNode;
            var h = e.offsetHeight;

            if (!h) {
                return "";
            }

            // get the text as a string
            var str = n.nodeValue;

            // remove a word from the end of the string
            // until the height of the element changes 
            // (ie. a line has been removed)
            var wIdx = n.nodeValue.lastIndexOf(' ');
            while (wIdx != -1 && e.offsetHeight == h) {
                n.nodeValue = n.nodeValue.substr(0, wIdx);
                wIdx = n.nodeValue.lastIndexOf(' ');
                if (wIdx == -1) wIdx = n.nodeValue.lastIndexOf('\n');
            }

            if (e.offsetHeight == h)
                n.nodeValue = "";
            // returns the removed text

            return str.substr(n.nodeValue.length);
        }

        // method= 'append'/'insertBefore', relative to col2
        function createNodeAncestors(n, col1, col2, method) {
            var ancestors = new Array;
            var insertNode = col2;
            var pn = n.parentNode;
            while (pn && pn.id != col1.id) {
                ancestors[ancestors.length] = pn;
                if (!pn.id) pn.id = ut.randomId();
                pn = pn.parentNode;
            }

            for (var i = ancestors.length - 1; i >= 0; i--) {

                for (var j = 0; j < insertNode.childNodes.length && (insertNode.childNodes[j].nodeType == 3 || !insertNode.childNodes[j].className.match(ancestors[i].id + '-css3mc')) ; j++) { }

                if (j == insertNode.childNodes.length) {
                    // Ancestor node not found, needs to be created.				
                    if (method == 'append')
                        insertNode = insertNode.appendChild(document.createElement(ancestors[i].tagName));
                    else
                        insertNode = insertNode.insertBefore(document.createElement(ancestors[i].tagName), insertNode.firstChild);
                    insertNode.className = ancestors[i].className + ' ' + ancestors[i].id + '-css3mc';
                    insertNode.style.marginTop = "0";
                    insertNode.style.paddingTop = "0";
                    if (insertNode.tagName.toUpperCase() == 'OL' && n.nodeType == 1 && n.tagName.toUpperCase() == 'LI') {
                        var prevsib = n.previousSibling;
                        var count = 0;
                        while (prevsib) {
                            if (prevsib.nodeType == 1 && prevsib.tagName.toUpperCase() == 'LI')
                                count++;
                            prevsib = prevsib.previousSibling;
                        }
                        insertNode.setAttribute('start', count);
                    }
                } else {
                    insertNode = insertNode.childNodes[j];
                    if (insertNode.tagName.toUpperCase() == 'OL' && (insertNode.start == -1 || insertNode.start == 1) && n.nodeType == 1 && n.tagName.toUpperCase() == 'LI') {
                        // happens if the tag was created while processing a text node.
                        var prevsib = n.previousSibling;
                        var count = 0;
                        while (prevsib) {
                            if (prevsib.nodeType == 1 && prevsib.tagName.toUpperCase() == 'LI')
                                count++;
                            prevsib = prevsib.previousSibling;
                        }
                        insertNode.setAttribute('start', count);
                    }
                }
            }
            return insertNode;
        }

        function moveNode(n, col1, col2) {
            var insertNode = createNodeAncestors(n, col1, col2, 'append');
            var movedNode = insertNode.appendChild(n.parentNode.removeChild(n));
            if (insertNode.id == col2.id && movedNode.nodeType == 1) {
                movedNode.style.paddingTop = "0px";
                movedNode.style.marginTop = "0px";
            }
            return movedNode;
        }


        function getElementRelativeTop(obj, refObj) {
            var cur = 0;
            if (obj.offsetParent) {
                while (obj.offsetParent) {
                    cur += obj.offsetTop;
                    obj = obj.offsetParent;
                }
            }
            var cur2 = 0;
            if (refObj.offsetParent) {
                while (refObj.offsetParent) {
                    cur2 += refObj.offsetTop;
                    refObj = refObj.offsetParent;
                }
            }
            return cur - cur2; // + document.body.offsetTop;
        }

    }

    // =====================================================================================
    // Utility Class Constructor skeleton
    function CSS3Utility() {
        // Event Handler utility list
        this.handlerList = new Array();
    }

    // getPseudoCssRules()
    // Constructor for a pseudo-css rule object 
    // (an unsupported property, thus not present in the DOM rules collection)

    // Constructor parameters
    // ----------------------
    // the css property name
    // the stylesheet (as a text stream)

    // Object properties: 
    // ------------------
    // selector (string)
    // property (string)
    // value (string)
    CSS3Utility.prototype.getPseudoCssRules = function (propertyName, serializedStylesheet) {
        this.cssRules = new Array();
        var valuePattern = propertyName.replace("-", "\-") + "[\\s]*:[\\s]*([^;}]*)[;}]";
        var selectorPattern = "$";
        var regx = new RegExp(valuePattern, "g");
        var regxMatch = regx.exec(serializedStylesheet);
        var j = 0;

        while (regxMatch) {
            var str = serializedStylesheet.substr(0, serializedStylesheet.substr(0, serializedStylesheet.indexOf(regxMatch[0])).lastIndexOf('{'));
            var selectorText = str.substr(str.lastIndexOf('}') + 1).replace(/^\s*|\s*$/g, "");
            // ignore commented rule !!  
            this.cssRules[j] = {};
            this.cssRules[j].selectorText = selectorText;
            this.cssRules[j].property = propertyName;
            this.cssRules[j].value = regxMatch[1].replace(/(\r?\n)*/g, "");  // suppress line breaks
            j++;
            regxMatch = regx.exec(serializedStylesheet);
        }
    }


    // Generates a random ID
    CSS3Utility.prototype.randomId = function () {
        var rId = "";
        for (var i = 0; i < 6; i++)
            rId += String.fromCharCode(97 + Math.floor((Math.random() * 24)))
        return rId;
    }


    // Object Instance
    var css3MC = new CSS3MultiColumn();
}(jQuery, window, window.document));