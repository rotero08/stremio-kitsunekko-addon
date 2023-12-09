const { convert } = require('subtitle-converter');
const AdmZip = require('adm-zip');
const axios = require('axios');

const iconv = require('iconv-jschardet');
iconv.skipDecodeWarning(true)
iconv.disableCodecDataWarn(true)


const iso639 = require('./ISO639');


class sub2vtt {
    constructor(url, opts = {}) {
        let { proxy, episode, type } = opts;
        this.url = url;
        this.proxy = proxy || {};
        this.data = null;
        this.size = null;
        this.error = null;
        this.type = type || null;
        this.client = null;
        this.episode = episode || null;
    }

    async GetData() {
        let res = await this.request({
            method: 'get',
            url: this.url,
            responseType: 'arraybuffer',
            Accept: this.type,
        });
        //console.log("res",res)
        if (res?.data) {
            this.type = this.type || res.headers["content-type"].split(';')[0];
            this.data = res.data;
            this.size = Number(res.headers["content-length"]);
        }
    }

    GiveData(data) {
        this.data = data;
    }
    DatafromHeaders(headers) {
        this.type = this.type || headers["content-type"].split(';')[0];
        this.size = Number(headers["content-length"]);
    }

    async getSubtitle() {
        try {
            // checking the link

            let file
            //console.log("this.type", this.type)
            //console.log("this.data", this.data)

            //if (!this.type) await this.CheckUrl()

            if (!this.type || !this.data) await this.GetData();
            if (!this.type || !this.data) throw "error getting sub"

            if (this.size?.length > 10000000) throw "file too big"
            console.log(this.type);
            if (this.supported.subs.includes(this.type)) {
                console.log("Estoy dentro de supported subs");
                file = await this.GetSub()
            } else {
                console.log("No estoy dentro de supported subs");
                if (file) file = await this.GetSub(file)
                else file = await this.GetSub()
            }
            return file
        } catch (e) {
            console.error(e);
        }
    }

    async GetSub(data) {
        try {
            let res;

            if (data) {
                res = data
            }
            else if (this.data) res = this.data
            else {
                res = await this.request({
                    method: 'get',
                    url: this.url,
                    responseType: 'arraybuffer'
                });
                if (res?.data) res = res.data
                if (!res) throw "error requesting file"
            }
            var data = iconv.encode(res, 'utf8').toString();
            // some subtitles have whitespaces in the end/ beginning of line
            let fixdata = data
            fixdata = fixdata.split(/\r?\n/)
            fixdata = fixdata.map(row => row.trim())
            data = fixdata.join('\n');
            //-----------------------------------------
            const outputExtension = '.vtt'; // conversion is based on output file extension
            const options = {
                removeTextFormatting: true,
                startAtZeroHour: false,
                timecodeOverlapLimiter: 1,
            };
            const { subtitle, status } = convert(data, outputExtension, options)
            console.log(status)

            if (subtitle) return { res: "success", subtitle: subtitle, status: status, res: data }
            if (status.success) return { res: "success", subtitle: subtitle, status: status, res: res }
            else return { res: "error", subtitle: null }
        } catch (err) {
            console.error(err);
            this.error = err;
            return { res: "error", subtitle: data }
        }
    }


    supported = {
        arc: ["application/zip", "application/x-zip-compressed", "application/x-rar", "application/x-rar-compressed", "application/vnd.rar"],
        subs: ["application/x-subrip", "text/vtt", "application/octet-stream"],
        arcs: {
            rar: ["application/x-rar", "application/x-rar-compressed", "application/vnd.rar"],
            zip: ["application/zip", "application/x-zip-compressed"]

        }
    }

    checkExtension(toFilter) { // return index of matched episodes
        return toFilter.match(/.dfxp|.scc|.srt|.ttml|.ssa|.vtt|.ass|.srt/gi)
    }
    checkEpisode(toFilter) {
        var reEpisode = new RegExp(this.episode, "gi");
        return toFilter.match(reEpisode)
    }

    async request(options) {
        if (!this.client) this.getClient()
        return await this.client(options)
            .catch(error => {
                if (error.response) {
                    console.error(error.response.status, error.response.statusText, error.config.url);
                } else if (error.cause) {
                    console.error(error.cause);
                } else {
                    console.error(error);
                }
            });

    }
    getClient() {
        let config = {
            timeout: 15000,
            headers: {}
        }
        if (this.proxy) config.headers = this.proxy;
        config.headers["Accept-Encoding"] = "gzip,deflate,compress";

        this.client = axios.create(config);
    }
    static gerenateUrl(url = String, opts) {
        let { proxy, type } = opts;
        let proxyString, data;
        data = new URLSearchParams();
        data.append("from", url)
        if (proxy) {
            proxyString = Buffer.from(JSON.stringify(proxy)).toString('base64');
            data.append("proxy", proxyString)
        }
        if (type) data.append("type", type);
        return data.toString();
    }
    static ISO() {
        return iso639;
    }
};

module.exports = sub2vtt;