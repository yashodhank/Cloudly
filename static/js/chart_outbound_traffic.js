/**
 * Load Average
 *
 * Set all action for Load Average chart
 * (code standards: http://javascript.crockford.com/code.html)
 */

var outboundTrafficInterval = {};  // set interval globally

/**
 * Call or stop interval update action (via parameter updateChart parameter)
 */
function updateOutboundTrafficChart(address, series, interval, duration, updateChart) {
    if (updateChart) {
        outboundTrafficInterval = setInterval(function () {    // start update by duration
            requestChartData(address, series, interval, true)    // update chart data
        }, duration);
    } else {
        window.clearInterval(outboundTrafficInterval);         // stop current interval
    }
}

/**
 * Display given chart with actual data
 */
function displayOutboundTrafficChart(address, chart, interval) {
    requestChartData(   // add new data to selected chart series
        address,
        chart.series,
        interval,
        false
    );
}

$(function () {
    $(document).ready(function () {
        var outboundTrafficChart = new Highcharts.Chart({  // create chart object
            chart: {
                renderTo: 'outbound_traffic',
                events: {
                    load: function() {
                        updateOutboundTrafficChart(    // set chart first draw update action
                            addressOutboundTraffic,
                            this.series,
                            interval,
                            setDuration(interval),
                            true
                        );
                    }
                }
            },
            title: {
                text: ''
            },
            subtitle: {
                text: ''
            },
            xAxis: {
                type: 'datetime',
                labels: {
                    formatter: function() {
                        return Highcharts.dateFormat('%H:%M:%S', this.value * 1000);    // chart need value in milisecond
                    }
                }
            },
            yAxis: {
                title: {
                    text: 'Load'
                },
                min: 0
            },
            tooltip: {
                formatter: function () {
                    return '<strong>' + Highcharts.numberFormat(this.y/1024, 0, '.', ',') + ' KB/s '
                        + 'output traffic</strong><br/>'
                        + Highcharts.dateFormat('%Y-%m-%d %H:%M:%S', this.x*1000);
                }
            },
            series: [
                {
                    name: 'Outbound Traffic',
                    data: []
                }
            ]
        });

        $('#outbound_traffic_interval a').on('click', function() { // catch interval change action
            var link = this,                                // create current object
                interval = $(link).attr('data-interval'),   // get interval from data attribute
                duration = setDuration(interval);           // set duration

            $('#outbound_traffic_interval a.active').removeClass('active');
            $(link).addClass('active');

            updateOutboundTrafficChart(    // stop last ajax chart update
                addressOutboundTraffic,
                outboundTrafficChart.series,
                interval,
                duration,
                false
            );

            displayOutboundTrafficChart(   // display chart with new interval
                addressOutboundTraffic,
                outboundTrafficChart,
                interval
            );

            updateOutboundTrafficChart(    // stop last ajax chart update
                addressOutboundTraffic,
                outboundTrafficChart.series,
                interval,
                duration,
                true
            );

        });

        displayOutboundTrafficChart(   // display chart with new interval
            addressOutboundTraffic,
            outboundTrafficChart,
            interval
        );
    });
});
