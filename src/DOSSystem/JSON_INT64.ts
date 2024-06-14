import Long from "long";

const suspectProtoRx = /(?:_|\\u005[Ff])(?:_|\\u005[Ff])(?:p|\\u0070)(?:r|\\u0072)(?:o|\\u006[Ff])(?:t|\\u0074)(?:o|\\u006[Ff])(?:_|\\u005[Ff])(?:_|\\u005[Ff])/;
const suspectConstructorRx = /(?:c|\\u0063)(?:o|\\u006[Ff])(?:n|\\u006[Ee])(?:s|\\u0073)(?:t|\\u0074)(?:r|\\u0072)(?:u|\\u0075)(?:c|\\u0063)(?:t|\\u0074)(?:o|\\u006[Ff])(?:r|\\u0072)/;


export class JSON_INT64 {
    protected static _options = {
        strict: false, // not being strict means do not generate syntax errors for "duplicate key"
        storeAsString: false, // toggles whether the values should be stored as BigNumber (default) or a string
        alwaysParseAsBig: false, // toggles whether all numbers should be Big
        useNativeBigInt: false, // toggles whether to use native BigInt instead of bignumber.js
        protoAction: 'error',
        constructorAction: 'error',
    };

    protected static at; // The index of the current character
    protected static ch; // The current character
    protected static escapee = {
        '"': '"',
        '\\': '\\',
        '/': '/',
        b: '\b',
        f: '\f',
        n: '\n',
        r: '\r',
        t: '\t',
    };
    protected static text;

    protected static cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
    protected static escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
    protected static gap;
    protected static indent;
    protected static meta = {    // table of character substitutions
        '\b': '\\b',
        '\t': '\\t',
        '\n': '\\n',
        '\f': '\\f',
        '\r': '\\r',
        '"': '\\"',
        '\\': '\\\\'
    };
    protected static rep;

    protected static error(m) {
        // Call error when something is wrong.

        throw {
            name: 'SyntaxError',
            message: m,
            at: JSON_INT64.at,
            text: JSON_INT64.text,
        };
    }
    protected static next(c?) {
        // If a c parameter is provided, verify that it matches the current character.

        if (c && c !== JSON_INT64.ch) {
            JSON_INT64.error("Expected '" + c + "' instead of '" + JSON_INT64.ch + "'");
        }

        // Get the next character. When there are no more characters,
        // return the empty string.

        JSON_INT64.ch = JSON_INT64.text.charAt(JSON_INT64.at);
        JSON_INT64.at += 1;
        return JSON_INT64.ch;
    }
    protected static number() {
        // Parse a number value.

        var number;
        var string = '';

        if (JSON_INT64.ch === '-') {
            string = '-';
            JSON_INT64.next('-');
        }
        while (JSON_INT64.ch >= '0' && JSON_INT64.ch <= '9') {
            string += JSON_INT64.ch;
            JSON_INT64.next();
        }
        if (JSON_INT64.ch === '.') {
            string += '.';
            while (JSON_INT64.next() && JSON_INT64.ch >= '0' && JSON_INT64.ch <= '9') {
                string += JSON_INT64.ch;
            }
        }
        if (JSON_INT64.ch === 'e' || JSON_INT64.ch === 'E') {
            string += JSON_INT64.ch;
            JSON_INT64.next();
            if (JSON_INT64.ch === '-' || JSON_INT64.ch === '+') {
                string += JSON_INT64.ch;
                JSON_INT64.next();
            }
            while (JSON_INT64.ch >= '0' && JSON_INT64.ch <= '9') {
                string += JSON_INT64.ch;
                JSON_INT64.next();
            }
        }
        number = +string;
        if (!isFinite(number)) {
            JSON_INT64.error('Bad number');
        } else {
            //if (BigNumber == null) BigNumber = require('bignumber.js');
            //if (number > 9007199254740992 || number < -9007199254740992)
            // Bignumber has stricter check: everything with length > 15 digits disallowed
            if (string.length > 15)
                return JSON_INT64._options.storeAsString
                    ? string
                    : JSON_INT64._options.useNativeBigInt
                        ? BigInt(string)
                        : Long.fromString(string);
            else
                return !JSON_INT64._options.alwaysParseAsBig
                    ? number
                    : JSON_INT64._options.useNativeBigInt
                        ? BigInt(number)
                        : Long.fromString(number);
        }
    }
    protected static string() {
        // Parse a string value.

        var hex,
            i,
            string = '',
            uffff;

        // When parsing for string values, we must look for " and \ characters.

        if (JSON_INT64.ch === '"') {
            var startAt = JSON_INT64.at;
            while (JSON_INT64.next()) {
                if (JSON_INT64.ch === '"') {
                    if (JSON_INT64.at - 1 > startAt) string += JSON_INT64.text.substring(startAt, JSON_INT64.at - 1);
                    JSON_INT64.next();
                    return string;
                }
                if (JSON_INT64.ch === '\\') {
                    if (JSON_INT64.at - 1 > startAt) string += JSON_INT64.text.substring(startAt, JSON_INT64.at - 1);
                    JSON_INT64.next();
                    if (JSON_INT64.ch === 'u') {
                        uffff = 0;
                        for (i = 0; i < 4; i += 1) {
                            hex = parseInt(JSON_INT64.next(), 16);
                            if (!isFinite(hex)) {
                                break;
                            }
                            uffff = uffff * 16 + hex;
                        }
                        string += String.fromCharCode(uffff);
                    } else if (typeof JSON_INT64.escapee[JSON_INT64.ch] === 'string') {
                        string += JSON_INT64.escapee[JSON_INT64.ch];
                    } else {
                        break;
                    }
                    startAt = JSON_INT64.at;
                }
            }
        }
        JSON_INT64.error('Bad string');
    }
    protected static white() {
        // Skip whitespace.

        while (JSON_INT64.ch && JSON_INT64.ch <= ' ') {
            JSON_INT64.next();
        }
    }
    protected static word = function () {
        // true, false, or null.

        switch (JSON_INT64.ch) {
            case 't':
                JSON_INT64.next('t');
                JSON_INT64.next('r');
                JSON_INT64.next('u');
                JSON_INT64.next('e');
                return true;
            case 'f':
                JSON_INT64.next('f');
                JSON_INT64.next('a');
                JSON_INT64.next('l');
                JSON_INT64.next('s');
                JSON_INT64.next('e');
                return false;
            case 'n':
                JSON_INT64.next('n');
                JSON_INT64.next('u');
                JSON_INT64.next('l');
                JSON_INT64.next('l');
                return null;
        }
        JSON_INT64.error("Unexpected '" + JSON_INT64.ch + "'");
    }
    protected static array() {
        // Parse an array value.

        var array = [];

        if (JSON_INT64.ch === '[') {
            JSON_INT64.next('[');
            JSON_INT64.white();
            if (JSON_INT64.ch === ']') {
                JSON_INT64.next(']');
                return array; // empty array
            }
            while (JSON_INT64.ch) {
                array.push(JSON_INT64.value());
                JSON_INT64.white();
                if (JSON_INT64.ch === ']') {
                    JSON_INT64.next(']');
                    return array;
                }
                JSON_INT64.next(',');
                JSON_INT64.white();
            }
        }
        JSON_INT64.error('Bad array');
    }
    protected static object() {
        // Parse an object value.

        var key,
            object = Object.create(null);

        if (JSON_INT64.ch === '{') {
            JSON_INT64.next('{');
            JSON_INT64.white();
            if (JSON_INT64.ch === '}') {
                JSON_INT64.next('}');
                return object; // empty object
            }
            while (JSON_INT64.ch) {
                key = JSON_INT64.string();
                JSON_INT64.white();
                JSON_INT64.next(':');
                if (
                    JSON_INT64._options.strict === true &&
                    Object.hasOwnProperty.call(object, key)
                ) {
                    JSON_INT64.error('Duplicate key "' + key + '"');
                }

                if (suspectProtoRx.test(key) === true) {
                    if (JSON_INT64._options.protoAction === 'error') {
                        JSON_INT64.error('Object contains forbidden prototype property');
                    } else if (JSON_INT64._options.protoAction === 'ignore') {
                        JSON_INT64.value();
                    } else {
                        object[key] = JSON_INT64.value();
                    }
                } else if (suspectConstructorRx.test(key) === true) {
                    if (JSON_INT64._options.constructorAction === 'error') {
                        JSON_INT64.error('Object contains forbidden constructor property');
                    } else if (JSON_INT64._options.constructorAction === 'ignore') {
                        JSON_INT64.value();
                    } else {
                        object[key] = JSON_INT64.value();
                    }
                } else {
                    object[key] = JSON_INT64.value();
                }

                JSON_INT64.white();
                if (JSON_INT64.ch === '}') {
                    JSON_INT64.next('}');
                    return object;
                }
                JSON_INT64.next(',');
                JSON_INT64.white();
            }
        }
        JSON_INT64.error('Bad object');
    }

    protected static value() {
        // Parse a JSON value. It could be an object, an array, a string, a number,
        // or a word.

        JSON_INT64.white();
        switch (JSON_INT64.ch) {
            case '{':
                return JSON_INT64.object();
            case '[':
                return JSON_INT64.array();
            case '"':
                return JSON_INT64.string();
            case '-':
                return JSON_INT64.number();
            default:
                return JSON_INT64.ch >= '0' && JSON_INT64.ch <= '9' ? JSON_INT64.number() : JSON_INT64.word();
        }
    }
    public static parse(source: string, reviver?: (this: any, key: string, value: any) => any): any {
        var result;

        JSON_INT64.text = source + '';
        JSON_INT64.at = 0;
        JSON_INT64.ch = ' ';
        result = JSON_INT64.value();
        JSON_INT64.white();
        if (JSON_INT64.ch) {
            JSON_INT64.error('Syntax error');
        }
        return result;
    }


    protected static quote(string) {

        // If the string contains no control characters, no quote characters, and no
        // backslash characters, then we can safely slap some quotes around it.
        // Otherwise we must also replace the offending characters with safe escape
        // sequences.

        JSON_INT64.escapable.lastIndex = 0;
        return JSON_INT64.escapable.test(string) ? '"' + string.replace(JSON_INT64.escapable, function (a) {
            var c = JSON_INT64.meta[a];
            return typeof c === 'string'
                ? c
                : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
        }) + '"' : '"' + string + '"';
    }

    protected static str(key, holder) {

        // Produce a string from holder[key].

        var i,          // The loop counter.
            k,          // The member key.
            v,          // The member value.
            length,
            mind = JSON_INT64.gap,
            partial,
            value = holder[key];

        // If the value has a toJSON method, call it to obtain a replacement value.

        if (value && typeof value === 'object' &&
            typeof value.toJSON === 'function') {
            value = value.toJSON(key);
        }

        // If we were called with a replacer function, then call the replacer to
        // obtain a replacement value.

        if (typeof JSON_INT64.rep === 'function') {
            value = JSON_INT64.rep.call(holder, key, value);
        }

        // What happens next depends on the value's type.

        switch (typeof value) {
            case 'string':
                return JSON_INT64.quote(value);
            case 'number':

                // JSON numbers must be finite. Encode non-finite numbers as null.

                return isFinite(value) ? String(value) : 'null';

            case 'boolean':
            case 'bigint':

                // If the value is a boolean or null, convert it to a string. Note:
                // typeof null does not produce 'null'. The case is included here in
                // the remote chance that this gets fixed someday.

                return String(value);

            // If the type is 'object', we might be dealing with an object or an array or
            // null.

            case 'object':

                // Due to a specification blunder in ECMAScript, typeof null is 'object',
                // so watch out for that case.

                if (!value) {
                    return 'null';
                }

                if (value instanceof Long)
                    return value.toString();

                // Make an array to hold the partial results of stringifying this object value.

                JSON_INT64.gap += JSON_INT64.indent;
                partial = [];

                // Is the value an array?

                if (Object.prototype.toString.apply(value) === '[object Array]') {

                    // The value is an array. Stringify every element. Use null as a placeholder
                    // for non-JSON values.

                    length = value.length;
                    for (i = 0; i < length; i += 1) {
                        partial[i] = JSON_INT64.str(i, value) || 'null';
                    }

                    // Join all of the elements together, separated with commas, and wrap them in
                    // brackets.

                    v = partial.length === 0
                        ? '[]'
                        : JSON_INT64.gap
                            ? '[\n' + JSON_INT64.gap + partial.join(',\n' + JSON_INT64.gap) + '\n' + mind + ']'
                            : '[' + partial.join(',') + ']';
                    JSON_INT64.gap = mind;
                    return v;
                }

                // If the replacer is an array, use it to select the members to be stringified.

                if (JSON_INT64.rep && typeof JSON_INT64.rep === 'object') {
                    length = JSON_INT64.rep.length;
                    for (i = 0; i < length; i += 1) {
                        if (typeof JSON_INT64.rep[i] === 'string') {
                            k = JSON_INT64.rep[i];
                            v = JSON_INT64.str(k, value);
                            if (v) {
                                partial.push(JSON_INT64.quote(k) + (JSON_INT64.gap ? ': ' : ':') + v);
                            }
                        }
                    }
                } else {

                    // Otherwise, iterate through all of the keys in the object.

                    Object.keys(value).forEach(function (k) {
                        var v = JSON_INT64.str(k, value);
                        if (v) {
                            partial.push(JSON_INT64.quote(k) + (JSON_INT64.gap ? ': ' : ':') + v);
                        }
                    });
                }

                // Join all of the member texts together, separated with commas,
                // and wrap them in braces.

                v = partial.length === 0
                    ? '{}'
                    : JSON_INT64.gap
                        ? '{\n' + JSON_INT64.gap + partial.join(',\n' + JSON_INT64.gap) + '\n' + mind + '}'
                        : '{' + partial.join(',') + '}';
                JSON_INT64.gap = mind;
                return v;
        }
    }

    public static stringify(value, replacer?, space?) {

        // The stringify method takes a value and an optional replacer, and an optional
        // space parameter, and returns a JSON text. The replacer can be a function
        // that can replace values, or an array of strings that will select the keys.
        // A default replacer method can be provided. Use of the space parameter can
        // produce text that is more easily readable.

        var i;
        JSON_INT64.gap = '';
        JSON_INT64.indent = '';

        // If the space parameter is a number, make an indent string containing that
        // many spaces.

        if (typeof space === 'number') {
            for (i = 0; i < space; i += 1) {
                JSON_INT64.indent += ' ';
            }

            // If the space parameter is a string, it will be used as the indent string.

        } else if (typeof space === 'string') {
            JSON_INT64.indent = space;
        }

        // If there is a replacer, it must be a function or an array.
        // Otherwise, throw an error.

        JSON_INT64.rep = replacer;
        if (replacer && typeof replacer !== 'function' &&
            (typeof replacer !== 'object' ||
                typeof replacer.length !== 'number')) {
            throw new Error('JSON.stringify');
        }

        // Make a fake root object containing our value under the key of ''.
        // Return the result of stringifying the value.

        return JSON_INT64.str('', { '': value });
    }
}