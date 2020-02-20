/*eslint-disable */
"use strict";

var $protobuf = require("protobufjs/minimal");

// Common aliases
var $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

// Exported root namespace
var $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

$root.updater = (function() {

    /**
     * Namespace updater.
     * @exports updater
     * @namespace
     */
    var updater = {};

    updater.UpdateData = (function() {

        /**
         * Properties of an UpdateData.
         * @memberof updater
         * @interface IUpdateData
         * @property {Array.<string>|null} [author] UpdateData author
         * @property {string|null} [changelog] UpdateData changelog
         * @property {string|null} [expiresOn] UpdateData expiresOn
         * @property {Uint8Array|null} [fileChecksum] UpdateData fileChecksum
         * @property {Uint8Array|null} [fileChecksumCompressed] UpdateData fileChecksumCompressed
         * @property {number|Long|null} [fileContentLength] UpdateData fileContentLength
         * @property {string|null} [minimumClientVersion] UpdateData minimumClientVersion
         * @property {string|null} [minimumWebAppVersion] UpdateData minimumWebAppVersion
         * @property {string|null} [releaseDate] UpdateData releaseDate
         * @property {number|null} [specVersion] UpdateData specVersion
         * @property {string|null} [targetEnvironment] UpdateData targetEnvironment
         * @property {string|null} [webappVersionNumber] UpdateData webappVersionNumber
         */

        /**
         * Constructs a new UpdateData.
         * @memberof updater
         * @classdesc Represents an UpdateData.
         * @implements IUpdateData
         * @constructor
         * @param {updater.IUpdateData=} [properties] Properties to set
         */
        function UpdateData(properties) {
            this.author = [];
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * UpdateData author.
         * @member {Array.<string>} author
         * @memberof updater.UpdateData
         * @instance
         */
        UpdateData.prototype.author = $util.emptyArray;

        /**
         * UpdateData changelog.
         * @member {string} changelog
         * @memberof updater.UpdateData
         * @instance
         */
        UpdateData.prototype.changelog = "";

        /**
         * UpdateData expiresOn.
         * @member {string} expiresOn
         * @memberof updater.UpdateData
         * @instance
         */
        UpdateData.prototype.expiresOn = "";

        /**
         * UpdateData fileChecksum.
         * @member {Uint8Array} fileChecksum
         * @memberof updater.UpdateData
         * @instance
         */
        UpdateData.prototype.fileChecksum = $util.newBuffer([]);

        /**
         * UpdateData fileChecksumCompressed.
         * @member {Uint8Array} fileChecksumCompressed
         * @memberof updater.UpdateData
         * @instance
         */
        UpdateData.prototype.fileChecksumCompressed = $util.newBuffer([]);

        /**
         * UpdateData fileContentLength.
         * @member {number|Long} fileContentLength
         * @memberof updater.UpdateData
         * @instance
         */
        UpdateData.prototype.fileContentLength = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * UpdateData minimumClientVersion.
         * @member {string} minimumClientVersion
         * @memberof updater.UpdateData
         * @instance
         */
        UpdateData.prototype.minimumClientVersion = "";

        /**
         * UpdateData minimumWebAppVersion.
         * @member {string} minimumWebAppVersion
         * @memberof updater.UpdateData
         * @instance
         */
        UpdateData.prototype.minimumWebAppVersion = "";

        /**
         * UpdateData releaseDate.
         * @member {string} releaseDate
         * @memberof updater.UpdateData
         * @instance
         */
        UpdateData.prototype.releaseDate = "";

        /**
         * UpdateData specVersion.
         * @member {number} specVersion
         * @memberof updater.UpdateData
         * @instance
         */
        UpdateData.prototype.specVersion = 0;

        /**
         * UpdateData targetEnvironment.
         * @member {string} targetEnvironment
         * @memberof updater.UpdateData
         * @instance
         */
        UpdateData.prototype.targetEnvironment = "";

        /**
         * UpdateData webappVersionNumber.
         * @member {string} webappVersionNumber
         * @memberof updater.UpdateData
         * @instance
         */
        UpdateData.prototype.webappVersionNumber = "";

        /**
         * Creates a new UpdateData instance using the specified properties.
         * @function create
         * @memberof updater.UpdateData
         * @static
         * @param {updater.IUpdateData=} [properties] Properties to set
         * @returns {updater.UpdateData} UpdateData instance
         */
        UpdateData.create = function create(properties) {
            return new UpdateData(properties);
        };

        /**
         * Encodes the specified UpdateData message. Does not implicitly {@link updater.UpdateData.verify|verify} messages.
         * @function encode
         * @memberof updater.UpdateData
         * @static
         * @param {updater.IUpdateData} message UpdateData message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        UpdateData.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.author != null && message.author.length)
                for (var i = 0; i < message.author.length; ++i)
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.author[i]);
            if (message.changelog != null && message.hasOwnProperty("changelog"))
                writer.uint32(/* id 2, wireType 2 =*/18).string(message.changelog);
            if (message.expiresOn != null && message.hasOwnProperty("expiresOn"))
                writer.uint32(/* id 3, wireType 2 =*/26).string(message.expiresOn);
            if (message.fileChecksum != null && message.hasOwnProperty("fileChecksum"))
                writer.uint32(/* id 4, wireType 2 =*/34).bytes(message.fileChecksum);
            if (message.fileChecksumCompressed != null && message.hasOwnProperty("fileChecksumCompressed"))
                writer.uint32(/* id 5, wireType 2 =*/42).bytes(message.fileChecksumCompressed);
            if (message.fileContentLength != null && message.hasOwnProperty("fileContentLength"))
                writer.uint32(/* id 6, wireType 1 =*/49).fixed64(message.fileContentLength);
            if (message.minimumClientVersion != null && message.hasOwnProperty("minimumClientVersion"))
                writer.uint32(/* id 7, wireType 2 =*/58).string(message.minimumClientVersion);
            if (message.minimumWebAppVersion != null && message.hasOwnProperty("minimumWebAppVersion"))
                writer.uint32(/* id 8, wireType 2 =*/66).string(message.minimumWebAppVersion);
            if (message.releaseDate != null && message.hasOwnProperty("releaseDate"))
                writer.uint32(/* id 9, wireType 2 =*/74).string(message.releaseDate);
            if (message.specVersion != null && message.hasOwnProperty("specVersion"))
                writer.uint32(/* id 10, wireType 5 =*/85).fixed32(message.specVersion);
            if (message.targetEnvironment != null && message.hasOwnProperty("targetEnvironment"))
                writer.uint32(/* id 11, wireType 2 =*/90).string(message.targetEnvironment);
            if (message.webappVersionNumber != null && message.hasOwnProperty("webappVersionNumber"))
                writer.uint32(/* id 12, wireType 2 =*/98).string(message.webappVersionNumber);
            return writer;
        };

        /**
         * Encodes the specified UpdateData message, length delimited. Does not implicitly {@link updater.UpdateData.verify|verify} messages.
         * @function encodeDelimited
         * @memberof updater.UpdateData
         * @static
         * @param {updater.IUpdateData} message UpdateData message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        UpdateData.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes an UpdateData message from the specified reader or buffer.
         * @function decode
         * @memberof updater.UpdateData
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {updater.UpdateData} UpdateData
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        UpdateData.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.updater.UpdateData();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    if (!(message.author && message.author.length))
                        message.author = [];
                    message.author.push(reader.string());
                    break;
                case 2:
                    message.changelog = reader.string();
                    break;
                case 3:
                    message.expiresOn = reader.string();
                    break;
                case 4:
                    message.fileChecksum = reader.bytes();
                    break;
                case 5:
                    message.fileChecksumCompressed = reader.bytes();
                    break;
                case 6:
                    message.fileContentLength = reader.fixed64();
                    break;
                case 7:
                    message.minimumClientVersion = reader.string();
                    break;
                case 8:
                    message.minimumWebAppVersion = reader.string();
                    break;
                case 9:
                    message.releaseDate = reader.string();
                    break;
                case 10:
                    message.specVersion = reader.fixed32();
                    break;
                case 11:
                    message.targetEnvironment = reader.string();
                    break;
                case 12:
                    message.webappVersionNumber = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes an UpdateData message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof updater.UpdateData
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {updater.UpdateData} UpdateData
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        UpdateData.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an UpdateData message.
         * @function verify
         * @memberof updater.UpdateData
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        UpdateData.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.author != null && message.hasOwnProperty("author")) {
                if (!Array.isArray(message.author))
                    return "author: array expected";
                for (var i = 0; i < message.author.length; ++i)
                    if (!$util.isString(message.author[i]))
                        return "author: string[] expected";
            }
            if (message.changelog != null && message.hasOwnProperty("changelog"))
                if (!$util.isString(message.changelog))
                    return "changelog: string expected";
            if (message.expiresOn != null && message.hasOwnProperty("expiresOn"))
                if (!$util.isString(message.expiresOn))
                    return "expiresOn: string expected";
            if (message.fileChecksum != null && message.hasOwnProperty("fileChecksum"))
                if (!(message.fileChecksum && typeof message.fileChecksum.length === "number" || $util.isString(message.fileChecksum)))
                    return "fileChecksum: buffer expected";
            if (message.fileChecksumCompressed != null && message.hasOwnProperty("fileChecksumCompressed"))
                if (!(message.fileChecksumCompressed && typeof message.fileChecksumCompressed.length === "number" || $util.isString(message.fileChecksumCompressed)))
                    return "fileChecksumCompressed: buffer expected";
            if (message.fileContentLength != null && message.hasOwnProperty("fileContentLength"))
                if (!$util.isInteger(message.fileContentLength) && !(message.fileContentLength && $util.isInteger(message.fileContentLength.low) && $util.isInteger(message.fileContentLength.high)))
                    return "fileContentLength: integer|Long expected";
            if (message.minimumClientVersion != null && message.hasOwnProperty("minimumClientVersion"))
                if (!$util.isString(message.minimumClientVersion))
                    return "minimumClientVersion: string expected";
            if (message.minimumWebAppVersion != null && message.hasOwnProperty("minimumWebAppVersion"))
                if (!$util.isString(message.minimumWebAppVersion))
                    return "minimumWebAppVersion: string expected";
            if (message.releaseDate != null && message.hasOwnProperty("releaseDate"))
                if (!$util.isString(message.releaseDate))
                    return "releaseDate: string expected";
            if (message.specVersion != null && message.hasOwnProperty("specVersion"))
                if (!$util.isInteger(message.specVersion))
                    return "specVersion: integer expected";
            if (message.targetEnvironment != null && message.hasOwnProperty("targetEnvironment"))
                if (!$util.isString(message.targetEnvironment))
                    return "targetEnvironment: string expected";
            if (message.webappVersionNumber != null && message.hasOwnProperty("webappVersionNumber"))
                if (!$util.isString(message.webappVersionNumber))
                    return "webappVersionNumber: string expected";
            return null;
        };

        /**
         * Creates an UpdateData message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof updater.UpdateData
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {updater.UpdateData} UpdateData
         */
        UpdateData.fromObject = function fromObject(object) {
            if (object instanceof $root.updater.UpdateData)
                return object;
            var message = new $root.updater.UpdateData();
            if (object.author) {
                if (!Array.isArray(object.author))
                    throw TypeError(".updater.UpdateData.author: array expected");
                message.author = [];
                for (var i = 0; i < object.author.length; ++i)
                    message.author[i] = String(object.author[i]);
            }
            if (object.changelog != null)
                message.changelog = String(object.changelog);
            if (object.expiresOn != null)
                message.expiresOn = String(object.expiresOn);
            if (object.fileChecksum != null)
                if (typeof object.fileChecksum === "string")
                    $util.base64.decode(object.fileChecksum, message.fileChecksum = $util.newBuffer($util.base64.length(object.fileChecksum)), 0);
                else if (object.fileChecksum.length)
                    message.fileChecksum = object.fileChecksum;
            if (object.fileChecksumCompressed != null)
                if (typeof object.fileChecksumCompressed === "string")
                    $util.base64.decode(object.fileChecksumCompressed, message.fileChecksumCompressed = $util.newBuffer($util.base64.length(object.fileChecksumCompressed)), 0);
                else if (object.fileChecksumCompressed.length)
                    message.fileChecksumCompressed = object.fileChecksumCompressed;
            if (object.fileContentLength != null)
                if ($util.Long)
                    (message.fileContentLength = $util.Long.fromValue(object.fileContentLength)).unsigned = false;
                else if (typeof object.fileContentLength === "string")
                    message.fileContentLength = parseInt(object.fileContentLength, 10);
                else if (typeof object.fileContentLength === "number")
                    message.fileContentLength = object.fileContentLength;
                else if (typeof object.fileContentLength === "object")
                    message.fileContentLength = new $util.LongBits(object.fileContentLength.low >>> 0, object.fileContentLength.high >>> 0).toNumber();
            if (object.minimumClientVersion != null)
                message.minimumClientVersion = String(object.minimumClientVersion);
            if (object.minimumWebAppVersion != null)
                message.minimumWebAppVersion = String(object.minimumWebAppVersion);
            if (object.releaseDate != null)
                message.releaseDate = String(object.releaseDate);
            if (object.specVersion != null)
                message.specVersion = object.specVersion >>> 0;
            if (object.targetEnvironment != null)
                message.targetEnvironment = String(object.targetEnvironment);
            if (object.webappVersionNumber != null)
                message.webappVersionNumber = String(object.webappVersionNumber);
            return message;
        };

        /**
         * Creates a plain object from an UpdateData message. Also converts values to other types if specified.
         * @function toObject
         * @memberof updater.UpdateData
         * @static
         * @param {updater.UpdateData} message UpdateData
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        UpdateData.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.arrays || options.defaults)
                object.author = [];
            if (options.defaults) {
                object.changelog = "";
                object.expiresOn = "";
                if (options.bytes === String)
                    object.fileChecksum = "";
                else {
                    object.fileChecksum = [];
                    if (options.bytes !== Array)
                        object.fileChecksum = $util.newBuffer(object.fileChecksum);
                }
                if (options.bytes === String)
                    object.fileChecksumCompressed = "";
                else {
                    object.fileChecksumCompressed = [];
                    if (options.bytes !== Array)
                        object.fileChecksumCompressed = $util.newBuffer(object.fileChecksumCompressed);
                }
                if ($util.Long) {
                    var long = new $util.Long(0, 0, false);
                    object.fileContentLength = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                } else
                    object.fileContentLength = options.longs === String ? "0" : 0;
                object.minimumClientVersion = "";
                object.minimumWebAppVersion = "";
                object.releaseDate = "";
                object.specVersion = 0;
                object.targetEnvironment = "";
                object.webappVersionNumber = "";
            }
            if (message.author && message.author.length) {
                object.author = [];
                for (var j = 0; j < message.author.length; ++j)
                    object.author[j] = message.author[j];
            }
            if (message.changelog != null && message.hasOwnProperty("changelog"))
                object.changelog = message.changelog;
            if (message.expiresOn != null && message.hasOwnProperty("expiresOn"))
                object.expiresOn = message.expiresOn;
            if (message.fileChecksum != null && message.hasOwnProperty("fileChecksum"))
                object.fileChecksum = options.bytes === String ? $util.base64.encode(message.fileChecksum, 0, message.fileChecksum.length) : options.bytes === Array ? Array.prototype.slice.call(message.fileChecksum) : message.fileChecksum;
            if (message.fileChecksumCompressed != null && message.hasOwnProperty("fileChecksumCompressed"))
                object.fileChecksumCompressed = options.bytes === String ? $util.base64.encode(message.fileChecksumCompressed, 0, message.fileChecksumCompressed.length) : options.bytes === Array ? Array.prototype.slice.call(message.fileChecksumCompressed) : message.fileChecksumCompressed;
            if (message.fileContentLength != null && message.hasOwnProperty("fileContentLength"))
                if (typeof message.fileContentLength === "number")
                    object.fileContentLength = options.longs === String ? String(message.fileContentLength) : message.fileContentLength;
                else
                    object.fileContentLength = options.longs === String ? $util.Long.prototype.toString.call(message.fileContentLength) : options.longs === Number ? new $util.LongBits(message.fileContentLength.low >>> 0, message.fileContentLength.high >>> 0).toNumber() : message.fileContentLength;
            if (message.minimumClientVersion != null && message.hasOwnProperty("minimumClientVersion"))
                object.minimumClientVersion = message.minimumClientVersion;
            if (message.minimumWebAppVersion != null && message.hasOwnProperty("minimumWebAppVersion"))
                object.minimumWebAppVersion = message.minimumWebAppVersion;
            if (message.releaseDate != null && message.hasOwnProperty("releaseDate"))
                object.releaseDate = message.releaseDate;
            if (message.specVersion != null && message.hasOwnProperty("specVersion"))
                object.specVersion = message.specVersion;
            if (message.targetEnvironment != null && message.hasOwnProperty("targetEnvironment"))
                object.targetEnvironment = message.targetEnvironment;
            if (message.webappVersionNumber != null && message.hasOwnProperty("webappVersionNumber"))
                object.webappVersionNumber = message.webappVersionNumber;
            return object;
        };

        /**
         * Converts this UpdateData to JSON.
         * @function toJSON
         * @memberof updater.UpdateData
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        UpdateData.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return UpdateData;
    })();

    updater.UpdateMessage = (function() {

        /**
         * Properties of an UpdateMessage.
         * @memberof updater
         * @interface IUpdateMessage
         * @property {Uint8Array} data UpdateMessage data
         * @property {Uint8Array} publicKey UpdateMessage publicKey
         * @property {Uint8Array} signature UpdateMessage signature
         */

        /**
         * Constructs a new UpdateMessage.
         * @memberof updater
         * @classdesc Represents an UpdateMessage.
         * @implements IUpdateMessage
         * @constructor
         * @param {updater.IUpdateMessage=} [properties] Properties to set
         */
        function UpdateMessage(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * UpdateMessage data.
         * @member {Uint8Array} data
         * @memberof updater.UpdateMessage
         * @instance
         */
        UpdateMessage.prototype.data = $util.newBuffer([]);

        /**
         * UpdateMessage publicKey.
         * @member {Uint8Array} publicKey
         * @memberof updater.UpdateMessage
         * @instance
         */
        UpdateMessage.prototype.publicKey = $util.newBuffer([]);

        /**
         * UpdateMessage signature.
         * @member {Uint8Array} signature
         * @memberof updater.UpdateMessage
         * @instance
         */
        UpdateMessage.prototype.signature = $util.newBuffer([]);

        /**
         * Creates a new UpdateMessage instance using the specified properties.
         * @function create
         * @memberof updater.UpdateMessage
         * @static
         * @param {updater.IUpdateMessage=} [properties] Properties to set
         * @returns {updater.UpdateMessage} UpdateMessage instance
         */
        UpdateMessage.create = function create(properties) {
            return new UpdateMessage(properties);
        };

        /**
         * Encodes the specified UpdateMessage message. Does not implicitly {@link updater.UpdateMessage.verify|verify} messages.
         * @function encode
         * @memberof updater.UpdateMessage
         * @static
         * @param {updater.IUpdateMessage} message UpdateMessage message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        UpdateMessage.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            writer.uint32(/* id 1, wireType 2 =*/10).bytes(message.data);
            writer.uint32(/* id 2, wireType 2 =*/18).bytes(message.publicKey);
            writer.uint32(/* id 3, wireType 2 =*/26).bytes(message.signature);
            return writer;
        };

        /**
         * Encodes the specified UpdateMessage message, length delimited. Does not implicitly {@link updater.UpdateMessage.verify|verify} messages.
         * @function encodeDelimited
         * @memberof updater.UpdateMessage
         * @static
         * @param {updater.IUpdateMessage} message UpdateMessage message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        UpdateMessage.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes an UpdateMessage message from the specified reader or buffer.
         * @function decode
         * @memberof updater.UpdateMessage
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {updater.UpdateMessage} UpdateMessage
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        UpdateMessage.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.updater.UpdateMessage();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.data = reader.bytes();
                    break;
                case 2:
                    message.publicKey = reader.bytes();
                    break;
                case 3:
                    message.signature = reader.bytes();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            if (!message.hasOwnProperty("data"))
                throw $util.ProtocolError("missing required 'data'", { instance: message });
            if (!message.hasOwnProperty("publicKey"))
                throw $util.ProtocolError("missing required 'publicKey'", { instance: message });
            if (!message.hasOwnProperty("signature"))
                throw $util.ProtocolError("missing required 'signature'", { instance: message });
            return message;
        };

        /**
         * Decodes an UpdateMessage message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof updater.UpdateMessage
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {updater.UpdateMessage} UpdateMessage
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        UpdateMessage.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an UpdateMessage message.
         * @function verify
         * @memberof updater.UpdateMessage
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        UpdateMessage.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (!(message.data && typeof message.data.length === "number" || $util.isString(message.data)))
                return "data: buffer expected";
            if (!(message.publicKey && typeof message.publicKey.length === "number" || $util.isString(message.publicKey)))
                return "publicKey: buffer expected";
            if (!(message.signature && typeof message.signature.length === "number" || $util.isString(message.signature)))
                return "signature: buffer expected";
            return null;
        };

        /**
         * Creates an UpdateMessage message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof updater.UpdateMessage
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {updater.UpdateMessage} UpdateMessage
         */
        UpdateMessage.fromObject = function fromObject(object) {
            if (object instanceof $root.updater.UpdateMessage)
                return object;
            var message = new $root.updater.UpdateMessage();
            if (object.data != null)
                if (typeof object.data === "string")
                    $util.base64.decode(object.data, message.data = $util.newBuffer($util.base64.length(object.data)), 0);
                else if (object.data.length)
                    message.data = object.data;
            if (object.publicKey != null)
                if (typeof object.publicKey === "string")
                    $util.base64.decode(object.publicKey, message.publicKey = $util.newBuffer($util.base64.length(object.publicKey)), 0);
                else if (object.publicKey.length)
                    message.publicKey = object.publicKey;
            if (object.signature != null)
                if (typeof object.signature === "string")
                    $util.base64.decode(object.signature, message.signature = $util.newBuffer($util.base64.length(object.signature)), 0);
                else if (object.signature.length)
                    message.signature = object.signature;
            return message;
        };

        /**
         * Creates a plain object from an UpdateMessage message. Also converts values to other types if specified.
         * @function toObject
         * @memberof updater.UpdateMessage
         * @static
         * @param {updater.UpdateMessage} message UpdateMessage
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        UpdateMessage.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                if (options.bytes === String)
                    object.data = "";
                else {
                    object.data = [];
                    if (options.bytes !== Array)
                        object.data = $util.newBuffer(object.data);
                }
                if (options.bytes === String)
                    object.publicKey = "";
                else {
                    object.publicKey = [];
                    if (options.bytes !== Array)
                        object.publicKey = $util.newBuffer(object.publicKey);
                }
                if (options.bytes === String)
                    object.signature = "";
                else {
                    object.signature = [];
                    if (options.bytes !== Array)
                        object.signature = $util.newBuffer(object.signature);
                }
            }
            if (message.data != null && message.hasOwnProperty("data"))
                object.data = options.bytes === String ? $util.base64.encode(message.data, 0, message.data.length) : options.bytes === Array ? Array.prototype.slice.call(message.data) : message.data;
            if (message.publicKey != null && message.hasOwnProperty("publicKey"))
                object.publicKey = options.bytes === String ? $util.base64.encode(message.publicKey, 0, message.publicKey.length) : options.bytes === Array ? Array.prototype.slice.call(message.publicKey) : message.publicKey;
            if (message.signature != null && message.hasOwnProperty("signature"))
                object.signature = options.bytes === String ? $util.base64.encode(message.signature, 0, message.signature.length) : options.bytes === Array ? Array.prototype.slice.call(message.signature) : message.signature;
            return object;
        };

        /**
         * Converts this UpdateMessage to JSON.
         * @function toJSON
         * @memberof updater.UpdateMessage
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        UpdateMessage.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return UpdateMessage;
    })();

    return updater;
})();

module.exports = $root;
