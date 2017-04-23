function loadEnumeResolver(obj, tkt)
{
    if (obj === null) {
        obj = {};

        obj.ActivationType = {
            MOCall: tkt.ActivationType.get_enum_value("MOCall"),
            MTCall: tkt.ActivationType.get_enum_value("MTCall"),
            HOIn: tkt.ActivationType.get_enum_value("HOIn"),
            HO3GIn: tkt.ActivationType.get_enum_value("HO3GIn"),
            HO4GIn: tkt.ActivationType.get_enum_value("HO4GIn")
        };

        obj.TerminationType = {
            Drop: tkt.TerminationType.get_enum_value("Drop")
        };
    }
}