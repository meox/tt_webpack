"use strict";

/*UcQ03*/
//./bin/TrueTicket runplugin Plugins/V8Worker 12000-13100 /mnt/disk-master/slabroot/INV-MC-01_NET0/ 1510060000-1510062300 script=../SRC/Plugins/V8Worker/Source/JS/ucq03.js inpath=V8Worker/in/ outpath=V8Worker/out

var TT_A    = 12000;
var TT_IUCS_OLD = 13100;
var TT_IUCS = 1004000;


var kpm,
	registry,
	tot_ticket = 0,
	tot_error = 0,
	tot_bad_imsi = 0,
	tot_no_callnumber = 0,
	tot_ticket_a = 0,
	tot_ticket_iucs = 0;


// define Record Template
var Record = {
	imsi : 0,
	callnumber : 1,
	prev_idx_ts : 2,
	activation_sec : 3,
	counter_call : 4,
	lac : 5,
	ci : 6,
	tac: 7
};

var listevents = new Table(8);

// KPM definition
var def_table = {
	name : getParam("prefix") + "_cell_recall",
	separator : ';',

	keys : [
		{
			name : "Cell",
			type: "pair_u32",
			mapper : function(lac, ci) {
				return registry.get_cellname(lac, ci);
			}
		},
		{ name : "LAC_CI", type: "pair_u32" },
		/*{ 
			name : "TAC",
			type: "uint64"
		}*/
	],
	columns : [
		{ name: "TotCall" },
		{ name: "TotCallGood" },
		{ name: "TotCallHO" },
		{ name: "WithAtLeastOneRecall" },
		{ name: "TotRecall" },
		{ name: "TotVoiceDrop" },
		{
			name: "Recall",
			dim_x : {
				name : "bin_recall",
				labels : ["1", "2", "3", "4", "5", "6", "N"],
				out_of_range : "last_bin"
			}
		}
	]
};


export function WorkOnTicket(tkt_type, tkt_ver, tkt, sec, nsec, last_sec, last_nsec)
{
	tot_ticket++;
	if (tkt_type !== TT_A && tkt_type !== TT_IUCS_OLD && tkt_type !== TT_IUCS)
	{
		tot_error++;
		return;
	}

	var imsi 				= tkt.IMSI.value,
		callnumber 			= tkt.CallNumber.value,
		tac 				= tkt.IMEI__TAC.value,
		activation_sec		= tkt.ActivationSec.value,
		activation_type		= tkt.ActivationType.value,
		termination_type	= tkt.TerminationType.value,
		termination_msec	= tkt.TerminationMSec.value,
		connection_msec 	= tkt.ConnectMSec.value,
		clear_type 			= tkt.ClearType.value,
		assignment_status 	= tkt.AssmtStatus.value,
		conn_snapshot 		= tkt.ConnSnapshot.value,
		cause_cc 			= tkt.CauseCC.value;

	var termcell_mcc, termcell_mnc;
	var termcell_lac, termcell_ci;

	switch(tkt_type)
	{
		case  TT_A:
		{
			tot_ticket_a++;
			termcell_mcc		= tkt.TerminationCell__cgi__MCC.value;
			termcell_mnc		= tkt.TerminationCell__cgi__MNC.value;
			termcell_lac		= tkt.TerminationCell__cgi__LAC.value;
			termcell_ci			= tkt.TerminationCell__cgi__CI.value;
			break;
		}
		case TT_IUCS_OLD:
		case TT_IUCS:
		{
			tot_ticket_iucs++;
			termcell_mcc		= tkt.TerminationSAI__SAI__MCC.value;
			termcell_mnc		= tkt.TerminationSAI__SAI__MNC.value;
			termcell_lac		= tkt.TerminationSAI__SAI__LAC.value;
			termcell_ci			= tkt.TerminationSAI__SAI__SAC.value;
			break;
		}
	}

	if (!check_field(termcell_lac) || !check_field(termcell_ci))
	{
		tot_error++;
		return;
	}

	if (imsi === null)
	{
		tot_bad_imsi++;
		return;
	}

	if (callnumber === null)
	{
		tot_no_callnumber++;
		return;
	}

	/*if (tac === null)
	{
		tot_error++;
		return;
	}*/


	//ActivationType: MOCall:0 MTCall:1 MOSms:2 MTSms:3 LUNorm:4 IMSIAtt:5 LUPer:6 IMSIDet:7 HOIn:8 EmergencyCall:9 SSvc:10 PerformLocationReq:11 Unk:12 PagingResponse:13 HO3GIn:14
	//                MOCall:0 MTCall:1 MOSms:2 MTSms:3 LUNorm:4 IMSIAtt:5 LUPer:6 IMSIDet:7 HOIn:8 EmergencyCall:9 SSvc:10 PerformLocationReq:11 Unk:12 PagingResponse:13 MOVideoCall:14 MTVideoCall:15 Data:16 Fax:17 Other_ITC:18 HO2GIn:19


	var is_mo_call		= (activation_type === 0);
	var is_mt_call		= (activation_type === 1);

	var is_ho = false;

	if (tkt_type === TT_A)
		is_ho = (activation_type === 8 || activation_type === 14);
	else
		is_ho = (activation_type === 8 || activation_type === 19);


	var is_normcallterm		= (clear_type === 3);
	var is_radio_present	= (assignment_status === 1);
	var is_voice_drop		= (clear_type >= 0 && clear_type < 3) && (conn_snapshot === 0 || conn_snapshot === 1) && (is_mo_call || is_mt_call || is_ho);
	var is_user_busy		= (cause_cc === 17 && connection_msec === 0);
	var is_valid			= (is_mo_call || is_mt_call) && is_normcallterm && is_radio_present && connection_msec > 0 && termination_msec > 0;

	callnumber 				= clear_callnumber(callnumber);

	//lookup imsi-callnumber
	var key_event  = imsi + '$' + callnumber;

	var is_present = listevents.has(key_event);
	var rec = null;

	var lac, ci;
	if (is_present)
	{
		rec = listevents.get(key_event, 0);
		lac = rec[Record.lac];
		ci  = rec[Record.ci];
	}
	else
	{
		lac = termcell_lac;
		ci  = termcell_ci;
	}


	// set KPM index
	kpm.setKeys([lac, ci], [lac, ci]/*, tac*/);


	// increment HOIN, HO3GIN
	if (is_ho)
	{
		kpm.TotCallHO_inc(1);
	}

	// increment drop
	if (is_voice_drop)
	{
		kpm.TotVoiceDrop_inc(1);
	}

	// from this point consider only call of type MO/MT
	if (!is_mo_call && !is_mt_call) // not a call
		return;

	// increment normal call
	kpm.TotCall_inc(1);

	// check if is this ticke is a "valid" ticket for our analisys
	if (!is_valid)
		return;

	kpm.TotCallGood_inc(1);

	if (is_present)
	{
		var diff = activation_sec - rec[Record.activation_sec];
		//println ("Refound:", rec[Record.imsi], rec[Record.callnumber], diff);

		// previous call exists
		if (diff < 300 /*5min*/ && activation_sec > 0)
		{
			kpm.TotRecall_inc(1); //Tot Recalled

			//update listevents with new data
			rec[Record.activation_sec]	= activation_sec;
			rec[Record.counter_call]	= rec[Record.counter_call] + 1;
			
			listevents.set(key_event, rec);
		}
		else
		{
			if (rec[Record.counter_call] > 1)
			{
				kpm.WithAtLeastOneRecall_inc(1);

				var recalled = rec[Record.counter_call] - 1;
				var bin_recall = (recalled - 1);
				if (bin_recall > 6)
					bin_recall = 6;

				kpm.Recall_inc_bin(1, bin_recall);
			}

			// reset event
			listevents.set(key_event, [
				imsi,
				callnumber,
				0,
				activation_sec,
				1, // counter_call
				termcell_lac,
				termcell_ci,
				tac
			]);
		}
	}
	else
	{
		listevents.set(key_event, [
			imsi,
			callnumber,
			0,
			activation_sec,
			1, // counter_call
			termcell_lac,
			termcell_ci,
			tac
		]);
	}
}


export function Start(params, from, to)
{
	try {
		kpm = new KpmManager(def_table);
		var inpath = getParam("inpath");

		println("Loading Registry ...");
		registry = new Registry(inpath);
	}
	catch(e) {
		println(e);
		return -1;
	}

	return 0;
}


export function BeginRop(rop, rop_index)
{
	println("BeginRop: ", rop_index);
}


export function EndRop(rop, rop_index)
{
	println("EndRop: ", rop_index);
	println("Pending events:", listevents.size());
}


export function End()
{
	flush_pending_call();

	var repday = getParam("repday");
	var outpath = getParam("outpath");
	
	kpm.dump(outpath + "/" + kpm.getName() + "_" + repday + '.csv');

	println("tot_ticket          =", tot_ticket);
	println("tot_ticket_a        =", tot_ticket_a);
	println("tot_ticket_iucs     =", tot_ticket_iucs);
	println("tot_error           =", tot_error);
	println("tot_bad_imsi        =", tot_bad_imsi);
	println("tot_no_callnumber   =", tot_no_callnumber);
	
	return 0;
}


/* HELPER FUNCTION */

function flush_pending_call()
{
	listevents.forEach(function(a, b, rec){
		if (rec[Record.counter_call] > 1)
		{
			var kpm_index = [rec[Record.lac], rec[Record.ci]];
			//var tac = rec[Record.tac];

			kpm.setKeys(kpm_index, kpm_index/*, tac*/);

			kpm.WithAtLeastOneRecall_inc(1);
			var recalled = rec[Record.counter_call] - 1;
			var bin_recall = (recalled - 1);
			if (bin_recall > 6)
				bin_recall = 6;

			kpm.Recall_inc_bin(1, bin_recall);
		}
	});
}


function check_field(f)
{
	if (typeof f !== 'undefined' && f !== null)
		return true;
	return false;
}


function clear_callnumber(callnumber)
{
	var len = callnumber.length;
	if (len >= 9)
		return callnumber.substr(-9);
	else
		return callnumber;
}
