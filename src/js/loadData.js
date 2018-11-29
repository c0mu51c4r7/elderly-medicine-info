(function(window){
  window.extractData = function() {
    var ret = $.Deferred();

    function onError() {
      console.log('Loading error', arguments);
      ret.reject();
    }

    function onReady(smart)  {
      if (smart.hasOwnProperty('patient')) {
        var patient = smart.patient;
        var pt = patient.read();
        var obv = smart.patient.api.fetchAll({
                    type: 'Observation',
                    query: {
                      code: {
                        $or: ['http://loinc.org|8302-2', 'http://loinc.org|8462-4',
                              'http://loinc.org|8480-6', 'http://loinc.org|2085-9',
                              'http://loinc.org|2089-1', 'http://loinc.org|55284-4',
                              'http://loinc.org|3141-9']
                      }
                    }
                  });
        var medicationOrder = smart.patient.api.fetchAll({
          type: 'MedicationOrder',
          query: {
            _count: 4
          }
        });
        // var medicationStatement = smart.patient.api.fetchAll({type: 'MedicationStatement'});
        // var MedicationAdministration = smart.patient.api.fetchAll({type: 'MedicationAdministration'});

        $.when(pt, obv).fail(onError);
        $.when(pt, obv).done(function(patient, obv) {
          var byCodes = smart.byCodes(obv, 'code');
          var gender = patient.gender;

          var fname = '';
          var lname = '';

          if (typeof patient.name[0] !== 'undefined') {
            fname = patient.name[0].given.join(' ');
            lname = patient.name[0].family.join(' ');
          }

          // Use LOINC codes
          var height = byCodes('8302-2');
          var weight = byCodes('3141-9');
          var systolicbp = getBloodPressureValue(byCodes('55284-4'),'8480-6');
          var diastolicbp = getBloodPressureValue(byCodes('55284-4'),'8462-4');
          var hdl = byCodes('2085-9');
          var ldl = byCodes('2089-1');

          var p = defaultPatient();
          p.birthdate = patient.birthDate;
          p.gender = gender;
          p.fname = fname;
          p.lname = lname;
          p.height = getQuantityValueAndUnit(height[0]);
          p.weight = getQuantityValueAndUnit(weight[0]);

          if (typeof systolicbp != 'undefined')  {
            p.systolicbp = systolicbp;
          }

          if (typeof diastolicbp != 'undefined') {
            p.diastolicbp = diastolicbp;
          }

          p.hdl = getQuantityValueAndUnit(hdl[0]);
          p.ldl = getQuantityValueAndUnit(ldl[0]);

          console.log(patient);
          console.log(obv);
          console.log(hdl);
          console.log(hdl[0]);
          console.log(ldl);
          console.log(ldl[0]);

          ret.resolve(p);
        });

        $.when(pt, medicationOrder).fail(onError);
        $.when(pt, medicationOrder).done(function(patient, medicationOrder) {
          console.log(medicationOrder);
          $('#medicationOrder0').html(medicationOrder[0].medicationCodeableConcept.text + " / " + medicationOrder[0].dosageInstruction[0].text);
          $('#medicationOrder1').html(medicationOrder[1].medicationCodeableConcept.text + " / " + medicationOrder[1].dosageInstruction[0].text);
          $('#medicationOrder2').html(medicationOrder[2].medicationCodeableConcept.text + " / " + medicationOrder[2].dosageInstruction[0].text);
          $('#medicationOrder3').html(medicationOrder[3].medicationCodeableConcept.text + " / " + medicationOrder[3].dosageInstruction[0].text);
        });

        // $.when(pt, MedicationAdministration).fail(onError);
        // $.when(pt, MedicationAdministration).done(function(patient, MedicationAdministration) {
        //   console.log(MedicationAdministration);
        // });
        //
        // $.when(pt, medicationStatement).fail(onError);
        // $.when(pt, medicationStatement).done(function(patient, medicationStatement) {
        //   console.log(medicationStatement);
        // });

      } else {
        onError();
      }
    }

    FHIR.oauth2.ready(onReady, onError);
    return ret.promise();

  };

  function defaultPatient(){
    return {
      fname: {value: ''},
      lname: {value: ''},
      gender: {value: ''},
      birthdate: {value: ''},
      height: {value: ''},
      weight: {value: ''},
      systolicbp: {value: ''},
      diastolicbp: {value: ''},
      ldl: {value: ''},
      hdl: {value: ''},
    };
  }

  // function defaultMedicationOrder(){
  //   return {
  //     medicationOrder: {value: ''}
  //   };
  // }

  function getBloodPressureValue(BPObservations, typeOfPressure) {
    var formattedBPObservations = [];
    BPObservations.forEach(function(observation){
      var BP = observation.component.find(function(component){
        return component.code.coding.find(function(coding) {
          return coding.code == typeOfPressure;
        });
      });
      if (BP) {
        observation.valueQuantity = BP.valueQuantity;
        formattedBPObservations.push(observation);
      }
    });

    return getQuantityValueAndUnit(formattedBPObservations[0]);
  }

  function getQuantityValueAndUnit(ob) {
    if (typeof ob != 'undefined' &&
        typeof ob.valueQuantity != 'undefined' &&
        typeof ob.valueQuantity.value != 'undefined' &&
        typeof ob.valueQuantity.unit != 'undefined') {
          return ob.valueQuantity.value + ' ' + ob.valueQuantity.unit;
    } else {
      return undefined;
    }
  }

  window.patientVisualization = function(p) {
    $('#holder').show();
    $('#loading').hide();
    $('#name').html(p.lname + " " + p.fname);
    $('#fname').html(p.fname);
    $('#lname').html(p.lname);
    $('#gender').html(p.gender);
    $('#birthdate').html(p.birthdate);
    $('#height').html(p.height);
    $('#weight').html(p.weight);
    $('#systolicbp').html(p.systolicbp);
    $('#diastolicbp').html(p.diastolicbp);
    $('#ldl').html(p.ldl);
    $('#hdl').html(p.hdl);
  };

  // window.medicationOrderVisualization = function(m) {
  //   console.log(m);
  //   $('#medicine1').html(m.medicationOrder[0].medicationCodeableConcept.text);
  // }

})(window);
