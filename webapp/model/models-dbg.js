sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "sap/ui/Device"
], function (JSONModel, Device) {
    "use strict";

    return {

        createDeviceModel: function () {
            var oModel = new JSONModel(Device);
            oModel.setDefaultBindingMode("OneWay");
            return oModel;
        },

        createAppModel: function (sModo) {

            var oModel = new JSONModel();
            var oData = {
                Modo: sModo,
                DescomposicionGasto1Enabled: Boolean,
                DescomposicionGasto2Enabled: Boolean,
                DescomposicionGasto3Enabled: Boolean,
                DescomposicionGasto4Enabled: Boolean,
                DescomposicionGasto5Enabled: Boolean
            };

            oModel.setData(oData);
            oModel.setSizeLimit(999999);
            return oModel;

        },

        createEstadosValidacionesModel: function () {

            var oModel = new JSONModel();
            oModel.setData({});
            oModel.setSizeLimit(999999);
            return oModel;

        },

        createImputacionesModel: function () {

            var oModel = new JSONModel();
            oModel.setData({});
            oModel.setSizeLimit(999999);
            return oModel;

        },

        createUsuariosModel: function () {

            var oModel = new JSONModel();
            oModel.setData({});
            oModel.setSizeLimit(999999);
            return oModel;

        },

        createLoginModel: function () {

            var oModel = new JSONModel();
            oModel.setData({});
            oModel.setSizeLimit(999999);
            return oModel;

        },

        createEstadosModel: function () {

            var oModel = new JSONModel();
            var oData = {
                "Estados": [
                    {
                        key: 1,
                        descripcion: "Creador"
                    },
                    {
                        key: 2,
                        descripcion: "Pendiente Responsable"
                    },
                    {
                        key: 3,
                        descripcion: "Pendiente Jefe"
                    },
                    {
                        key: 4,
                        descripcion: "Pendiente Contabilidad"
                    },
                    {
                        key: 5,
                        descripcion: "Pendiente Gerente Área"
                    },
                    {
                        key: 6,
                        descripcion: "Pendiente Gerente AyF"
                    },
                    {
                        key: 7,
                        descripcion: "Pendiente Gerente General"
                    },
                    {
                        key: 8,
                        descripcion: "Aprobado"
                    },
                    {
                        key: 9,
                        descripcion: "Rechazado"
                    },
                    {
                        key: 10,
                        descripcion: "Cancelado"
                    }
                ]

            };
            oModel.setData(oData);
            oModel.setSizeLimit(999999);
            return oModel;

        },

        createFiltrosModel: function () {

            var sFechaHasta = new Date();
            var sFechaDesde = new Date();
            sFechaDesde.setMonth(sFechaHasta.getMonth() - 3);

            var oModel = new JSONModel();
            var oData = {
                AFE: "",
                FechaDesde: sFechaDesde,
                FechaHasta: sFechaHasta,
                Estados: [],
                Usuarios: []
            };
            oModel.setData(oData);
            oModel.setSizeLimit(999999);
            return oModel;

        },

        createValueHelpModel: function () {

            var oModel = new JSONModel();
            var oData = {
                Responsables: [],
                Jefes: [],
                Sectores: [],
                Imputaciones: [],
                Gerente: ""
            };
            oModel.setData(oData);
            oModel.setSizeLimit(999999);
            return oModel;

        },

        createSeguimientoModel: function () {

            var oModel = new JSONModel();
            var oData = {
                "Historial": []
            };
            oModel.setData(oData);
            oModel.setSizeLimit(999999);
            return oModel;

        },

        createAFEModel: function () {

            var oModel = new JSONModel();
            var oData = {
                AFE: "",
                Estado: "2", // estado inicial 'Pendiente responsable'
                Complementario: false,
                NumeroRevision: "0",
                FechaEmision: new Date(),
                Creador: "",
                Responsable: "",
                Jefe: "",
                Gerente: "",
                SectorOrigen: "",
                PeriodoDesde: new Date().getFullYear().toString(),
                PeriodoHasta: new Date().getFullYear().toString(),
                ImputadoA: "",
                Titulo: "",
                TituloEditable: false,
                Categoria: "",
                Codigo: "",
                TipoInversionMantCapital: false,
                TipoInversionCrecRentabilidad: false,
                TipoInversionDatosEditables: false,
                MontoPresupuestado: "0",
                MontoSolicitado: "0",
                MontoSolicitadoMoneda: "USD",
                MontoMonedaOrigen: "0",
                MontoMonedaOrigenMoneda: "",
                Diferencia: "0",
                MontoCompensado: "0",
                Desvio: "0",
                DescomposicionGasto1: "0",
                DescomposicionGasto2: "0",
                DescomposicionGasto3: "0",
                DescomposicionGasto4: "0",
                DescomposicionGasto5: "0",
                ResumenPropuesta: "",
                AniosVidaUtilEstimados: "0",
                FechaEstimadaCierre: new Date(),
                RetornoInversion: "0",
                IncluyeReemplazos: false,
                Observacion: "",
                InformeTecnicoDescripcion: "",
                InformeTecnicoDestino: "",
                InformeTecnicoCalculo: "",
                DatosComplementariosObjetivo: "",
                DatosComplementariosJustificacion: "",
                DatosComplementariosAlcance: "",
                DatosComplementariosAntecedentes: "",
                DatosComplementariosEstimacion: "",
                DatosComplementariosAlternativas: "",
                DatosComplementariosVariacion: "",
                DatosComplementariosImpactoAmbiental: "",
                DatosComplementariosCronograma: "",
                To_Adjuntos: []
            };

            oModel.setData(oData);
            oModel.setSizeLimit(999999);
            return oModel;

        },

        createLanesModel: function () {
            var oModel = new JSONModel();
            var oData = {
                "Flujo1": [
                    {
                        "id": "1",
                        "icon": "sap-icon://employee",
                        "label": "Creador",
                        "position": 0,
                        "state": []
                    }, {
                        "id": "2",
                        "icon": "sap-icon://supplier",
                        "label": "Responsable",
                        "position": 1,
                        "state": []
                    }, {
                        "id": "3",
                        "icon": "sap-icon://leads",
                        "label": "Jefe",
                        "position": 2,
                        "state": []
                    }, {
                        "id": "4",
                        "icon": "sap-icon://capital-projects",
                        "label": "Contabilidad",
                        "position": 3,
                        "state": []
                    }, {
                        "id": "5",
                        "icon": "sap-icon://activity-individual",
                        "label": "Gerente Área",
                        "position": 4,
                        "state": []
                    }, {
                        "id": "6",
                        "icon": "sap-icon://complete",
                        "label": "Finalizado",
                        "position": 5
                    }
                ],
                "Flujo2": [
                    {
                        "id": "1",
                        "icon": "sap-icon://employee",
                        "label": "Creador",
                        "position": 0,
                        "state": []
                    }, {
                        "id": "2",
                        "icon": "sap-icon://supplier",
                        "label": "Responsable",
                        "position": 1,
                        "state": []
                    }, {
                        "id": "3",
                        "icon": "sap-icon://leads",
                        "label": "Jefe",
                        "position": 2,
                        "state": []
                    }, {
                        "id": "4",
                        "icon": "sap-icon://capital-projects",
                        "label": "Contabilidad",
                        "position": 3,
                        "state": []
                    }, {
                        "id": "5",
                        "icon": "sap-icon://activity-individual",
                        "label": "Gerente Área",
                        "position": 4,
                        "state": []
                    }, {
                        "id": "6",
                        "icon": "ssap-icon://hr-approval",
                        "label": "Gerente AyFi",
                        "position": 5
                    }, {
                        "id": "7",
                        "icon": "sap-icon://complete",
                        "label": "Finalizado",
                        "position": 6
                    }
                ],
                "Flujo3": [
                    {
                        "id": "1",
                        "icon": "sap-icon://employee",
                        "label": "Creador",
                        "position": 0,
                        "state": []
                    }, {
                        "id": "2",
                        "icon": "sap-icon://supplier",
                        "label": "Responsable",
                        "position": 1,
                        "state": []
                    }, {
                        "id": "3",
                        "icon": "sap-icon://leads",
                        "label": "Jefe",
                        "position": 2,
                        "state": []
                    }, {
                        "id": "4",
                        "icon": "sap-icon://capital-projects",
                        "label": "Contabilidad",
                        "position": 3,
                        "state": []
                    }, {
                        "id": "5",
                        "icon": "sap-icon://activity-individual",
                        "label": "Gerente Área",
                        "position": 4,
                        "state": []
                    }, {
                        "id": "6",
                        "icon": "sap-icon://hr-approval",
                        "label": "Gerente AyFi",
                        "position": 5
                    }, {
                        "id": "7",
                        "icon": "sap-icon://opportunities",
                        "label": "Gerente General",
                        "position": 6
                    }, {
                        "id": "8",
                        "icon": "sap-icon://complete",
                        "label": "Finalizado",
                        "position": 7
                    }
                ]
            };

            oModel.setData(oData);
            oModel.setSizeLimit(999999);
            return oModel;
        },

        createWorkflowModel: function () {
            var oModel = new JSONModel();
            var oData = {
                Informacion: {
                    "nodes": [],
                    "lanes": []
                }
            };

            oModel.setData(oData);
            oModel.setSizeLimit(999999);
            return oModel;
        }

    };
});