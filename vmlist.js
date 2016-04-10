"use strict";

$(() => {
    var $list = $("#libvirt-domains");
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

    function update_domstate(uuid, res) {
        domains[uuid].$tr.removeClass("libvirt-domain-started libvirt-domain-stopped");
        switch (res) {
            case "shut off":
                domains[uuid].$tr.addClass("libvirt-domain-stopped");
                break;
            case "running":
                domains[uuid].$tr.addClass("libvirt-domain-started");
                break;
        }
    }

    function show_info(uuid, cmd, $elem) {
        spawn_proc(['virsh', cmd, uuid], (res) => {
            res = res.split("\n")[0];
            $elem.text(res);
            switch (cmd) {
                case "domstate":
                    update_domstate(uuid, res);
                    break;
            }
        }, () => {
            $elem.text("(error)");
        });
    }

    function add_domain(uuid, $tbody) {
        var $td_uuid = $("<td />").text(uuid);
        var $td_id = $("<td />");
        var $td_name = $("<td />");
        var $td_state = $("<td />");

        var $start = $("<button class=\"libvirt-action libvirt-action-start\">Start</button>");
        var $stop = $("<button class=\"libvirt-action libvirt-action-shutdown\">Shutdown</button>");
        var $td_actions = $("<td />").append($start, $stop);

        var $tr = $("<tr class=\"libvirt-domain\" />").append($td_uuid, $td_id, $td_name, $td_state, $td_actions).data("uuid", uuid);

        domains[uuid] = {
            $tr: $tr,
            $id: $td_id,
            $name: $td_name,
            $state: $td_state
        };

        $tbody.append($tr);
        refresh_domain(uuid);
    }

    function refresh_domain(uuid) {
        var domain = domains[uuid];

        domain.$id.text("(getting info)");
        domain.$name.text("(getting info)");
        domain.$state.text("(getting info)");

        show_info(uuid, "domid", domain.$id);
        show_info(uuid, "domname", domain.$name);
        show_info(uuid, "domstate", domain.$state);
    }

    function start_domain(uuid) {
        spawn_proc(['virsh', 'start', uuid], (res) => {
            refresh_domain(uuid);
        }, () => {
            alert("Failed to start " + uuid);
        });
    }

    function shutdown_domain(uuid) {
        spawn_proc(['virsh', 'shutdown', uuid], (res) => {
            refresh_domain(uuid);
        }, () => {
            alert("Failed to shutdown " + uuid);
        });
    }

    $list.on("click", ".libvirt-action-start", function () {
        var $tr = $(this).closest("tr").removeClass("libvirt-domain-stopped");
        var uuid = $tr.data("uuid");
        start_domain(uuid);
    });

    $list.on("click", ".libvirt-action-shutdown", function () {
        var $tr = $(this).closest("tr").removeClass("libvirt-domain-started");
        var uuid = $tr.data("uuid");
        shutdown_domain(uuid);
    });

    function refresh_vms() {
        $tbody.empty();

        spawn_proc(["virsh", "list", "--all", "--uuid"], (output) => {
            var uuids = output.split("\n").filter((value) => {
                return value !== "";
            });

            for (var i = 0; i < uuids.length; i++) {
                add_domain(uuids[i], $tbody);
            }
        }, () => {
            alert("Failed to get list of VMs");
        });
    }

    refresh_vms();
    $("#libvirt-refresh").on("click", refresh_vms);
});
