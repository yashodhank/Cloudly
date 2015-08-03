
var server = $('input[name="hwaddr"]').val(),           // server identifier
    interval = '3m',                                    // base interval setting
    serverMacAddress = server.replace(/-/g, ":"),       // server mac address
    optionalLength = 55,                                // set optional data lenght globally

    // server info ajax calls
    addressServerInfo = '/ajax/server/' + server + '/metrics/server_info/',
    addressUpdateServerName ='/ajax/server/name/update/',

    // dataTable ajax call
    addressProcessesTable = '/ajax/server/' + server + '/metrics/processes/',
    addressNetworkConnectionsTable = '/ajax/server/' + server + '/metrics/network_connections/',
    addressActiveNetworkConnectionsTable = '/ajax/server/' + server + '/metrics/active_network_connections/',

    // graphs ajax calls
    addressLoadavg = '/ajax/server/' + server + '/metrics/loadavg/',
    addressCpuUsage = '/ajax/server/' + server + '/metrics/cpu_usage/',
    addressMemUsage = '/ajax/server/' + server + '/metrics/mem_usage/',
    addressOutboundTraffic = '/ajax/server/' + server + '/metrics/outbound_traffic/',
    addressInboundTraffic = '/ajax/server/' + server + '/metrics/inbound_traffic/',
    addressDisks = '/ajax/server/' + server + '/metrics/disks/';

(function($) {
    $.fn.deactivePanel = function() {
        this
            .find('.btn-minimize')
            .find('i')
            .attr('class','fa fa-chevron-down');

        this
            .find('.panel-body')
            .css('display','none');
    };
})(jQuery);

(function($) {
    $.fn.updateProgressBar = function(data, title, dangerValue, stdClass) {
        var progressBar = $(this).find('.progress-bar');
        var progressBarTitle = $(this).find('h6');

        if (data < dangerValue) {
            progressBar.removeClass('progress-bar-danger');
            progressBar.addClass(stdClass);
        } else {
            progressBar.removeClass(stdClass);
            progressBar.addClass('progress-bar-danger');
        }

        progressBar.attr('aria-valuenow', data);
        progressBar.css('width', data + '%');
        progressBarTitle.text(title + ' (' + data +'%)');
    };
})(jQuery);

function updateServerInfo() {
    $.ajax({
        "url": addressServerInfo,
        "type": "POST",
        "dataType": "json",
        "headers": {
            'X-CSRFToken': csrf
        },
        "cache": false,
        "data": {
            "server": server,
            "secret": secret
        },
        "success": function(data) {
            var actualServername = $("#servername").text().trim(),
                serverStatus = data["server_info_status"].toLowerCase();

            if (actualServername != data["name"]) {
                checkServerName(data["name"]);
                $("#servername").text(data["name"]);
            }

            $(".server_info_status").text(serverStatus);
            if (serverStatus != 'offline') {
                var loadavgProgressBarValue = Math.round((data["loadavg_used"] * 100)),
                    loadavgServerInfoValue = data["server_info_loadavg"].join();

                loadavgServerInfoValue = loadavgServerInfoValue.replace(/,/g," ");  // replace all coma to space

                $("#running_message").hide();
                $(".server_last_seen").hide();

                $("#current_load").show();
                $("#system_metrics").show();
                $("#networking").show();
                $("#network_sessions").show();
                $("#active_network_sessions").show();
                $("#disks").show();
                $("#disk_graphs").show();
                $("#running_processes").show();
                $("#services_discovery").show();
                $("#fixed_problems").show();
                $(".server_uptime").show();
                $(".server_loadavg").show();

                $(".server_info_hostname").text(data["server_info_hostname"]);
                $(".server_info_uptime").text(data["server_info_uptime"]);
                $(".server_info_loadavg").text(loadavgServerInfoValue);

                $(".cpu_usage_progress_bar").updateProgressBar(
                    data["cpu_used"],
                    "CPU",
                    85,
                    "progress-bar-success"
                );
                $(".memory_usage_progress_bar").updateProgressBar(
                    data["memory_used"],
                    "Memory",
                    98,
                    "progress-bar-info"
                );
                $(".swap_usage_progress_bar").updateProgressBar(
                    data["swap_used"],
                    "Swap",
                    80,
                    "progress-bar-info"
                );
                $(".loadavg_usage_progress_bar").updateProgressBar(
                    loadavgProgressBarValue,
                    "Load average",
                    100,
                    "progress-bar-info"
                );
            } else {
                $(".server_last_seen").show();
                $("#running_message").show();

                $(".server_uptime").hide();
                $(".server_loadavg").hide();
                $("#current_load").hide();
                $("#system_metrics").hide();
                $("#networking").hide();
                $("#network_sessions").hide();
                $("#active_network_sessions").hide();
                $("#disks").hide();
                $("#disk_graphs").hide();
                $("#running_processes").hide();
                $("#services_discovery").hide();
                $("#fixed_problems").hide();
            }
        },
        "error": function(data, textStatus, errorThrown) {
            console.log("error: " + textStatus);
            console.log("error: " + errorThrown);
        }
    });
};

/**
 * Set duration by interval value
 */
function setDuration(interval) {
    var duration = '3000';      // base duration value
    if (interval == '15m') {
        duration = '15000';
    } else if (interval == '1h') {
        duration = '60000';
    } else if (interval == '1d') {
        duration = '300000';
    } else if (interval == '7d') {
        duration = '1800000';
    } else if (interval == '30d') {
        duration = '43200000';
    } else if (interval == 'at') {
        duration = '1800000';
    }
    return duration;
}

/**
 * Get new data via ajax call and set it to given serie
 */
function requestChartData(address, series, interval, updateChart, mountPoint) {
    $.ajax({
        url: address,
        type: 'POST',
        dataType: 'json',
        headers: {
            'X-CSRFToken': csrf
        },
        cache: false,
        data: {
            'server': server,
            'secret': secret,
            'interval': interval,
            'mountPoint': mountPoint
        },
        success: function(data) {
            if (data !== undefined && data !== null && data[0].length > 0) {
                for (var i = 0; i < data.length; i++) {
                    if (updateChart) {
                        series[i].addPoint(data[i][0], true, true);   // add new point to chart serie
                    } else {
                        series[i].setData(addFirstChartData(data[i])) // add data set to chart serie
                    }
                }
            }
        },
        error: function(data, textStatus, errorThrown) {
            console.log('error: ' + textStatus);
            console.log('error: ' + errorThrown);
        }
    });
}

/**
 * Check, fill and sort given data with global parametrs
 */
function addFirstChartData(data) {
    var optionalData = [],          // empty optional data array
        dataLength = data.length;   // current data lenght

    for (var i = 0; i < (optionalLength - dataLength); i++) {
        optionalData.push([
            (data[0][0] - (i + 1) * 3), // set timestamp value
            null                        // set cpu usage value
        ]);
    }

    optionalData = optionalData.concat(data);   // fill data to optional lenght
    return data.reverse();          // chart need reverted data
}

/**
 * Check current and given servername, update breadcrumb info and show/hide
 * info with mac address
 */
function checkServerName(servername) {
    if (servername == "" || servername == serverMacAddress) {       // show/hide info icon
        $("#mac-address-tooltip").hide();
        $(".breadcrumb > li.servername").text(serverMacAddress);    // change breadcrumb value
    } else {
        $("#mac-address-tooltip").show();
        $(".breadcrumb > li.servername").text(servername);          // change breadcrumb value
    }
}

$(document).ready(function() {
    updateServerInfo();
    $('#diskGraphs').deactivePanel();
    $('#serviceDiscovery').deactivePanel();
    $('#serverActivity').deactivePanel();
    $('#activeNetworkSessions').deactivePanel();

    $("#mac-address-tooltip").attr("title", "MAC Address: " + serverMacAddress);
    if ($("#servername").text().trim() != serverMacAddress) {
        $("#mac-address-tooltip").show();
    }

    var shiftWindow = function() {
       scrollBy(0, -90);
    }

    if (location.hash) {
        shiftWindow();
    }

    window.addEventListener("hashchange", shiftWindow);

    Highcharts.setOptions({ // set global chart options
        global: {
            useUTC: false   // set UTC by TSDB setting
        }
    });

    $('#servername').editable({
        "params": function (params) {
            var data = {};
            data["id"] = params.pk;
            data["server"] = server;
            data["secret"] = secret;
            data[params.name] = params.value.trim();
            return data;
        },
        "ajaxOptions": {
            "headers": {
                'X-CSRFToken': csrf
            },
            "dataType": "json",
        },
        "defaultValue": serverMacAddress,
        "emptytext": serverMacAddress,
        "emptyclass": "",
        "type": "text",
        "pk": 1,
        "url": addressUpdateServerName,
        "title": "Enter new server name",
        "success": function(response, newValue) {
            checkServerName(newValue.trim());
            if (response.status == "error") {
                console.log(response.msg); //msg will be shown in editable form
            }
        }
    });

    var processTable = $("#running_processes_table").DataTable({
        "lengthMenu": [[15, 50, 100, -1], [15, 50, 100, "All"]],
        "order": [[ 2, "desc" ]],
        "responsive": true,
        "ajax": {
            "url": addressProcessesTable,
            "type": "POST",
            "headers": {
                "X-CSRFToken": csrf
            },
            "data": {
                "secret": secret,
                "server": server
            }
        },
        "columns": [
            { "data": "pid" },
            { "data": "user" },
            { "data": "cpu" },
            { "data": "mem" },
            { "data": "process" },
            { "data": "command" }
        ]
    });

    var networkConnectionsTable = $("#network_connections").DataTable({
        "lengthMenu": [[10, 30, 50, -1], [10, 30, 50, "All"]],
        "order": [[ 3, "asc" ]],
        "responsive": true,
        "ajax": {
            "url": addressNetworkConnectionsTable,
            "type": "POST",
            "headers": {
                "X-CSRFToken": csrf
            },
            "data": {
                "secret": secret,
                "server": server
            }
        },
        "columns": [
            { "data": "proto" },
            { "data": "recv-q" },
            { "data": "send-q" },
            { "data": "address" },
            { "data": "port" }
        ]
    });

    var activeNetworkConnectionsTable = $("#active_network_connections").DataTable({
        "lengthMenu": [[50, 10, 30, 100, -1], [50, 10, 30, 100, "All"]],
        "order": [[ 3, "asc" ]],
        "responsive": true,
        "ajax": {
            "url": addressActiveNetworkConnectionsTable,
            "type": "POST",
            "headers": {
                "X-CSRFToken": csrf
            },
            "data": {
                "secret": secret,
                "server": server
            }
        },
        "columns": [
            { "data": "proto" },
            { "data": "recv-q" },
            { "data": "send-q" },
            { "data": "foreign-address" },
            { "data": "local-address" }
        ]
    });

    setInterval(function () {
        updateServerInfo();
        processTable.ajax.reload(null, false);
        networkConnectionsTable.ajax.reload(null, false);
        activeNetworkConnectionsTable.ajax.reload(null, false);
    }, 1000);
});

