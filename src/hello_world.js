/*UcHelloWorld*/
//./bin/TrueTicket runplugin Plugins/V8Worker 12000 /mnt/disk-master/slabroot/omni-slabroot 1510060000-1510062300 script=/home/meox/TrueTicket/INSTALL/DATADIR/JS/bundle.js inpath=V8Worker/in/ outpath=V8Worker/out

import * as common_voice from './common/voice';

"use strict";

//define global variable
var kpm,
    registry,
    tot_ticket = 0,
    tot_bad_ticket = 0,
    tot_noimsi_ticket = 0,
    EnumResolver = null;


var def_table_cell = {
    name: '1_cell',
    separator: ';',
    keys: [
        {
            name: "Cell",
            type: "pair_u32",
            mapper: function (lac, ci) {
                var cell_name = registry.get_cellname(lac, ci);
                return cell_name;
            }
        },
        {
            name: "LAC_CI",
            type: "pair_u32"
        }
    ],
    columns: [
        { name: "totcall", label: "Tot_Call" },
        {
            name: "drop",
            label: "Tot_Drop",
            dim_x: {
                out_of_range: "ignore",
                labels: ["MO", "MT"]
            }
        },
        { name: "voicedrop", label: "Voice_Drop" }
    ]
};


export function Start(params, from, to) {
    try {
        println("Max Ver 12000:", getTicketDefVer(12000));
        println("Max Ver 1004000:", getTicketDefVer(1004000));

        //println("getEnumStrings(12000, ActivationType):", getEnumStrings(12000, "ActivationType"));
        //println("\ngetEnumStrings(12000, TerminationType):", getEnumStrings(12000, "TerminationType"));
        //println("\ngetFields(12000):", getTicketFields(12000));
        //exit(0);

        kpm = new KpmManager(def_table_cell);
        var inpath = getParam("inpath");
        registry = new Registry(inpath);
    }
    catch (e) {
        println(e);
        exit(1);
    }

    return 0;
}


export function WorkOnTicket(tkt_type, tkt_ver, tkt, sec, nsec, last_sec, last_nsec) {
    var imsi = tkt.IMSI;
    var lac = tkt.TerminationCell__cgi__LAC;
    var ci = tkt.TerminationCell__cgi__CI;

    if (!lac.is_present || !ci.is_present) {
        tot_bad_ticket++;
        return;
    }

    if (!imsi.is_present) {
        tot_noimsi_ticket++;
        return;
    }

    var activation_type = tkt.ActivationType.value;
    var termination_type = tkt.TerminationType.value;
    var clear_type = tkt.ClearType.value;
    var conn_snapshot = tkt.ConnSnapshot.value;

    EnumResolver = common_voice.loadEnumeResolver(EnumResolver, tkt);

    var is_mo_call = (activation_type === EnumResolver.ActivationType.MOCall), // (activation_type == 0),
        is_mt_call = (activation_type === EnumResolver.ActivationType.MTCall), // (activation_type == 1),
        is_ho = (activation_type === EnumResolver.ActivationType.HOIn || activation_type === EnumResolver.ActivationType.HO3GIn || activation_type === EnumResolver.ActivationType.HO4GIn),
        is_drop = (termination_type === EnumResolver.TerminationType.Drop),
        is_voice_drop = (clear_type >= 0 && clear_type < 3) && (conn_snapshot === 0 || conn_snapshot === 1) && (is_mo_call || is_mt_call || is_ho);

    var index = [lac.value, ci.value];

    kpm.setKeys(index, index);

    // consider only MO or MT call
    if (is_mo_call || is_mt_call)
        kpm.totcall_inc(1);
    else
        return 0;

    if (is_voice_drop)
        kpm.voicedrop_inc(1);

    if (is_drop) {
        if (is_mo_call)
            kpm.drop_inc(1, 0);
        else if (is_mt_call)
            kpm.drop_inc(1, 1);
    }

    tot_ticket++;
    return true;
}


export function BeginRop(rop, rop_index) {
    println("BeginRop:", rop, rop_index);
}


export function EndRop(rop, rop_index) {
    println("EndRop:", rop, rop_index);
    return true;
}


export function End() {
    var repday = getParam("repday");
    var outpath = getParam("outpath");

    kpm.dump(outpath + "/1_cell_" + repday + ".csv");

    println("tot_ticket: ", tot_ticket);
    println("tot_bad_ticket: ", tot_bad_ticket);
    println("tot_noimsi_ticket: ", tot_noimsi_ticket);

    return true;
}
