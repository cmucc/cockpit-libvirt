"use strict";

$(() => {
    var $list = $("#libvirt-stats");
    var $header = $list.find("thead tr");
    var $tbody = $list.find("tbody");

    var domains = {};
    var output = "";

    function spawn_proc(args, resolve, reject) {
        var res = "";
        var proc = cockpit.spawn(args);
        proc.done(() => { resolve(res); });
        proc.fail(reject);
        proc.stream((data) => { res += data; });
    }

    function refresh_stats() {
        $header.empty();
        $tbody.empty();

        spawn_proc(["virt-top", "--script", "-n", "1", "--csv", "/dev/stdout"], (output) => {
            var lines = output.split("\n").filter((value) => {
                return value !== "";
            });

            var header = lines[0].split(",");
            for (var i = 0; i < header.length; i++) {
                var $th = $("<th />").text(header[i]);
                $header.append($th);
            }

            for (var i = 1; i < lines.length; i++) {
                var fields = lines[i].split(",");
                var $tr = $("<tr />");
                for (var j = 0; j < fields.length; j++) {
                    var $td = $("<td />").text(fields[j]);
                    $tr.append($td);
                }
                $tbody.append($tr);
            }
        }, () => {
            alert("Failed to get list of VMs");
        });
    }

    refresh_stats();
    $("#libvirt-refresh").on("click", refresh_stats);
});
