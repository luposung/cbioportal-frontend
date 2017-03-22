/**
 * Created by aaronlisman on 3/2/17.
 */

import { handlePathologyReportCheckResponse } from './PatientViewPageStore';
// import React from 'react';
import { assert } from 'chai';
// import { shallow, mount } from 'enzyme';
// import sinon from 'sinon';
// //import AppConfig from 'appConfig';
// import request from 'superagent';

describe('ClinicalInformationSamplesTable', () => {

    before(()=>{

    });

    after(()=>{

    });

    it('if there are pdf items in response, returns collection, otherwise returns empty array', ()=>{
        let result = handlePathologyReportCheckResponse({
            total_count:1,
            items:[ { url:'someUrl', name:'someName' } ]
        });
        assert.deepEqual(result,[{ url: 'someUrl' , name: 'someName'}]);

        result = handlePathologyReportCheckResponse({
            total_count:0,
        });
        assert.deepEqual(result,[]);
    });

});