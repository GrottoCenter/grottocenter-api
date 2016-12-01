import React from 'react';

export default class RandomCave extends React.Component {

    constructor(props) {
        super(props);
        this.state = { // TODO: go get default at Metadata ?
            name: "",
            length: "",
            depth: "",
        };
        this.fetchData({});
    }

    fetchData(filters) {
        var url = "/cave/findRandom";
        $.get(url, this.updateCave.bind(this)); // TODO: remove jquery
    }
    updateCave(data) {
        this.setState(data[0]);
    }
    render() {
        return (
            <div className="randomcave row">
              <div className="col-xs-6">
                <h4>
                  Pyrénées Orientales (66) - FR
                  <br/><br/>
                  <a href="fichedetailleecavite.html" target="blank">{this.state.name}</a>
                </h4>

                <ul className="rating">
                  <li>Interest :
                    <img src="images/1star.svg"/>
                    2
                    <i className="icon icon-user"></i>
                  </li>
                  <li>Ease of move :
                    <img src="images/5stars.svg"/>
                    2
                    <i className="icon icon-user"></i>
                  </li>
                  <li>Access :
                    <img src="images/2stars.svg"/>
                    2
                    <i className="icon icon-user"></i>
                  </li>
                </ul>

                <div className="infos">
                  <span><img src="images/time-to-go.svg" height="50" width="50" title="time to go"/>
                    01h30</span>
                  <span><img src="images/underground_time.svg" height="50" width="50" title="underground time"/>
                    21h30</span>
                    <span><img src="images/length.svg" height="50" width="50" title="length"/> {this.state.length}
                      m</span>
                    <span><img src="images/depth.svg" height="50" width="50" title="depth"/> {this.state.depth}
                      m</span>
                </div>
              </div>
              <div className="col-xs-6">
                <img className="img img-responsive" src="images/topo1.png"/>
              </div>
            </div>
        );
    }
}
