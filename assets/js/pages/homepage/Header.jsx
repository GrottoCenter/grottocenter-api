import React from 'react'
import LanguagePicker from './../../components/LanguagePicker'
// import SearchBar from './../../components/SearchBar';

import { Provider } from 'react-redux'
import { createStore } from 'redux'
import { searchReducers } from './../../reducers/SearchReducers'
import ReduxSearchBar from './../../containers/ReduxSearchBar'

class Header extends React.Component {

    render() {
        var store = createStore(searchReducers);
        return (
            <header className="header fixed-top clearfix">

              <div className="container-fluid">

                <div className="row brand bgwhite">
                  <div className="col-xs-12">
                    <a href="" className="logo">
                      <img src="/images/logo.svg" alt="logo-wikicaves"/>
                    </a>
                    <h1 className="sitename">Grottocenter</h1>
                    <span className="slogan">
                      The Wiki database made by cavers for cavers.
                    </span>
                  </div>
                </div>

                <div className="row bgwhite">
                  <div className="col-xs-12">
                    <img className="logofse" src="/images/FSE.svg" alt="logo-fse"/>
                    <span className="gc-fse-info">
                      Grottocenter is supported by the FSE
                    </span>
                  </div>
                </div>

                <div className="row searchbar">
                  <div className="col-xs-12">
                      <Provider store={store}>
                          <ReduxSearchBar />
                      </Provider>
                  </div>
                </div>
              </div>
            </header>
        )
    }
}
export default Header;
