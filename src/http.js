var http = (function () {

    var _defaultHeaders = [];

    return {
        get: get,
        post: post,
        setHeader: setHeader
    };

    // ==================================================================================

    function get(url, headers) {
        return xhr('GET', url, null, headers);
    }

    function post(url, data, headers) {
        // headers = headers || [{ name: 'Content-Type', value: 'application/json' }];
        return xhr('POST', url, data, headers);
    }

    function setHeader(name, value) {
        var header = _defaultHeaders.find(function (h) { return h.name === name; });
        if (header) {
            header.value = value;
        } else {
            _defaultHeaders.push({ 'name': name, 'value': value });
        }
    }

    // ==================================================================================

    function xhr(method, url, data, headers) {
        var xhr = new XMLHttpRequest();
        xhr._cbs = [];
        xhr._ers = [];
        xhr.onreadystatechange = function () {
            if (xhr.readyState !== 4) return;
            (xhr.status === 200 ? runCallbacks : runErrors)(xhr.response);
        };
        xhr.open(method, url, true);
        _defaultHeaders.forEach(function (h) {
            if (h.value === undefined || h.value === null) return;
            xhr.setRequestHeader(h.name, h.value);
        });

        (headers || []).forEach(function (h) {
            if (h.value === undefined || h.value === null) return;
            xhr.setRequestHeader(h.name, h.value);
        });
        // xhr.send(JSON.stringify(data));
        xhr.send(data);

        return {
            then: createThen()
        };

        function createThen() {
            return function (cb, err) {
                cb && xhr._cbs.push(cb);
                err && xhr._ers.push(err);
                return { then: createThen() };
            };
        }

        function runCallbacks(res) {
            run(xhr._cbs)(res);
        }

        function runErrors(res) {
            run(xhr._ers)(res);
        }

        function run(arr) {
            var resHeaders = {};
            (xhr.getAllResponseHeaders() || '').split('\n').forEach(function (h) {
                var sp = (h || '').split(':');
                resHeaders[(sp[0] || '').trim()] = (sp[1] || '').trim();
            });
            return function rec(res) {
                var fn = arr.splice(0, 1)[0];
                if (!fn) return;
                var result = fn(res, resHeaders);
                rec(result);
            };
        }

    }

})();