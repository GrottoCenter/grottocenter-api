import RandomCave from './../../widgets/RandomCave';

const RandomEntry = () => (
    <div>
      <div role="section" className="randomEntryBg">
        <h2  style={{'text-align': 'center', 'padding-bottom': '50px'}}>RANDOM ENTRY</h2>
        <div className="container-fluid">
          <RandomCave/>
        </div>
      </div>
    </div>
);

export default RandomEntry;
