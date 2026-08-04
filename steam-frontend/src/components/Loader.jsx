import styled from 'styled-components';

const Loader = () => {
  return (
    <StyledWrapper>
      <div className="brutal-loader">
        <div className="block b1" />
        <div className="block b2" />
        <div className="block b3" />
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 15px;

  .brutal-loader {
    display: flex;
    gap: 8px;
  }

  .block {
    width: 20px;
    height: 35px;
    border: 3px solid #000;
    box-shadow: 3px 3px 0px 0px #000;
    animation: brutalBounce 0.6s infinite alternate ease-in-out;
  }

  .b1 {
    background-color: #ff5722; /* Laranja choque */
    animation-delay: 0s;
  }

  .b2 {
    background-color: #ffeb3b; /* Amarelo choque */
    animation-delay: 0.2s;
  }

  .b3 {
    background-color: #00e676; /* Verde choque */
    animation-delay: 0.4s;
  }

  @keyframes brutalBounce {
    0% {
      transform: translateY(0);
      box-shadow: 3px 3px 0px 0px #000;
    }
    100% {
      transform: translateY(-12px);
      box-shadow: 3px 12px 0px 0px #000;
    }
  }
`;

export default Loader;