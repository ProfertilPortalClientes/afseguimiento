sap.ui.define([], function () {
    "use strict";
    return {

        getIconoAdjunto: function (psExtension) {
            switch (psExtension) {
                case "xls":
                case "xlsx":
                    return "sap-icon://excel-attachment";
                case "doc":
                case "docx":
                    return "sap-icon://doc-attachment";
                case "pdf":
                    return "sap-icon://pdf-attachment";
                case "jpg":
                case "png":
                    return "sap-icon://attachment-photo";
                default:
                    return "sap-icon://attachment";
            }
        },

        getStatusText: function (psEstado) {
            switch (psEstado) {
                case "1":
                    return "Inicial";
                case "2":
                    return "Pendiente Responsable";
                case "3":
                    return "Pendiente Jefe";
                case "4":
                    return "Pendiente Contabilidad";
                case "5":
                    return "Pendiente Gerente Área";
                case "6":
                    return "Pendiente Gerente AyFi";
                case "7":
                    return "Pendiente Gerente General";
                case "8":
                    return "Aprobado";
                case "9":
                    return "Rechazado";
                case "10":
                    return "Cancelado";
                case "11":
                    return "Borrador";
                default:
                    break;
            }
        },

        getImputacionText: function(psImputacion) {
            switch (psImputacion) {
                case "1":
                    return "Sin presupuesto";
                case "2":
                    return "Con presupuesto MOC";
                case "3":
                    return "Con presupuesto año próximo";
                default:
                    return psImputacion;
            }
        }

    };
});