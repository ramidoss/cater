import React, { useState } from 'react'
import styled from 'styled-components'
import { 
  Bell, 
  RotateCcw, 
  Database, 
  ChevronRight, 
  X,
  Megaphone,
  Flame
} from 'lucide-react'

const AppContainer = styled.div`
  max-width: 375px;
  margin: 0 auto;
  background-color: #f5f5f5;
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
`

const StatusBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 20px;
  background-color: #f5f5f5;
  font-size: 14px;
  font-weight: 600;
  color: #000;
`

const StatusLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`

const StatusRight = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`

const BatteryIcon = styled.div`
  width: 24px;
  height: 12px;
  border: 1px solid #000;
  border-radius: 2px;
  position: relative;
  background-color: #000;
  
  &::after {
    content: '';
    position: absolute;
    right: -3px;
    top: 3px;
    width: 2px;
    height: 6px;
    background-color: #000;
    border-radius: 0 1px 1px 0;
  }
`

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background-color: #f5f5f5;
`

const HeaderTitle = styled.h1`
  font-size: 24px;
  font-weight: 600;
  color: #333;
`

const HeaderIcons = styled.div`
  display: flex;
  gap: 16px;
`

const IconButton = styled.button`
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  color: #666;
  
  &:hover {
    color: #333;
  }
`

const OffersSection = styled.div`
  padding: 0 20px 20px;
`

const OffersCarousel = styled.div`
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 10px;
  
  &::-webkit-scrollbar {
    display: none;
  }
`

const OfferCard = styled.div<{ $bgColor: string }>`
  min-width: 280px;
  height: 140px;
  background: ${props => props.$bgColor};
  border-radius: 16px;
  padding: 20px;
  position: relative;
  cursor: pointer;
  transition: transform 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
  }
`

const OfferText = styled.div`
  color: white;
  
  h3 {
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 4px;
    opacity: 0.9;
  }
  
  h2 {
    font-size: 28px;
    font-weight: 700;
    line-height: 1.1;
  }
`

const OfferIcon = styled.div`
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  width: 60px;
  height: 60px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
`

const CarouselDots = styled.div`
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 16px;
`

const Dot = styled.div<{ $active: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${props => props.$active ? '#4CAF50' : '#ddd'};
  cursor: pointer;
  transition: background-color 0.2s ease;
`

const LimitCard = styled.div`
  margin: 0 20px 20px;
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`

const LimitHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
`

const LimitIcon = styled.div`
  width: 40px;
  height: 40px;
  background: #e3f2fd;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1976d2;
`

const LimitTitle = styled.h3`
  font-size: 18px;
  color: #666;
  font-weight: 500;
`

const LimitAmount = styled.div`
  margin-bottom: 8px;
  
  .amount {
    font-size: 32px;
    font-weight: 700;
    color: #333;
  }
  
  .currency {
    font-size: 20px;
    color: #666;
    margin-left: 4px;
  }
`

const LimitSubtext = styled.p`
  color: #666;
  font-size: 14px;
  margin-bottom: 20px;
`

const ExploreButton = styled.button`
  width: 100%;
  background: #1976d2;
  color: white;
  border: none;
  padding: 16px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background-color 0.2s ease;
  
  &:hover {
    background: #1565c0;
  }
`

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px 16px;
`

const SectionTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: #333;
`

const SeeAllButton = styled.button`
  background: none;
  border: none;
  color: #1976d2;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  
  &:hover {
    text-decoration: underline;
  }
`

const PaymentReminder = styled.div`
  margin: 0 20px 20px;
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;
`

const CloseButton = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  cursor: pointer;
  color: #666;
  padding: 4px;
  
  &:hover {
    color: #333;
  }
`

const ReminderTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
`

const ReminderText = styled.p`
  color: #666;
  font-size: 14px;
  line-height: 1.4;
  margin-bottom: 20px;
`

const PaymentSection = styled.div`
  margin-bottom: 20px;
`

const PaymentLabel = styled.h4`
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
`

const PaymentItem = styled.div`
  background: #f8f9fa;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const PaymentDetails = styled.div`
  .month {
    font-size: 16px;
    font-weight: 500;
    color: #1976d2;
  }
`

const PaymentAmount = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: #333;
`

const ActionButtons = styled.div`
  display: flex;
  gap: 12px;
`

const SecondaryButton = styled.button`
  flex: 1;
  background: #f5f5f5;
  color: #333;
  border: none;
  padding: 16px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;
  
  &:hover {
    background: #e0e0e0;
  }
`

const PrimaryButton = styled.button`
  flex: 2;
  background: #1976d2;
  color: white;
  border: none;
  padding: 16px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;
  
  &:hover {
    background: #1565c0;
  }
`

const BottomIndicator = styled.div`
  width: 134px;
  height: 5px;
  background: #000;
  border-radius: 3px;
  margin: 20px auto;
`

function App() {
  const [activeOffer, setActiveOffer] = useState(0)
  const [showReminder, setShowReminder] = useState(true)

  const offers = [
    {
      title: "Check Out Our",
      subtitle: "LATEST OFFERS",
      bgColor: "linear-gradient(135deg, #d4a574 0%, #c4956a 100%)",
      icon: <Megaphone size={32} color="white" />
    },
    {
      title: "Special Deal",
      subtitle: "12% OFF FIRST",
      bgColor: "linear-gradient(135deg, #81c784 0%, #66bb6a 100%)",
      icon: <Flame size={32} color="white" />
    }
  ]

  const handleOfferClick = (index: number) => {
    setActiveOffer(index)
    console.log(`Clicked offer ${index + 1}`)
  }

  const handleExploreOptions = () => {
    console.log('Explore options clicked')
  }

  const handleSeeAll = () => {
    console.log('See all circles clicked')
  }

  const handleCloseReminder = () => {
    setShowReminder(false)
  }

  const handleCircleDetails = () => {
    console.log('Circle details clicked')
  }

  const handlePayment = () => {
    console.log('Pay 5,000 EGP clicked')
  }

  const handleBellClick = () => {
    console.log('Notifications clicked')
  }

  const handleRefreshClick = () => {
    console.log('Refresh clicked')
  }

  return (
    <AppContainer>
      <StatusBar>
        <StatusLeft>
          <span>12:16</span>
          <span>✈</span>
        </StatusLeft>
        <StatusRight>
          <span>•••</span>
          <span>📶</span>
          <span>📶</span>
          <BatteryIcon />
        </StatusRight>
      </StatusBar>

      <Header>
        <HeaderTitle>Home</HeaderTitle>
        <HeaderIcons>
          <IconButton onClick={handleRefreshClick}>
            <RotateCcw size={24} />
          </IconButton>
          <IconButton onClick={handleBellClick}>
            <Bell size={24} />
          </IconButton>
        </HeaderIcons>
      </Header>

      <OffersSection>
        <OffersCarousel>
          {offers.map((offer, index) => (
            <OfferCard 
              key={index} 
              $bgColor={offer.bgColor}
              onClick={() => handleOfferClick(index)}
            >
              <OfferText>
                <h3>{offer.title}</h3>
                <h2>{offer.subtitle}</h2>
              </OfferText>
              <OfferIcon>
                {offer.icon}
              </OfferIcon>
            </OfferCard>
          ))}
        </OffersCarousel>
        
        <CarouselDots>
          {offers.map((_, index) => (
            <Dot 
              key={index} 
              $active={index === activeOffer}
              onClick={() => setActiveOffer(index)}
            />
          ))}
        </CarouselDots>
      </OffersSection>

      <LimitCard>
        <LimitHeader>
          <LimitIcon>
            <Database size={20} />
          </LimitIcon>
          <LimitTitle>Available limit</LimitTitle>
        </LimitHeader>
        
        <LimitAmount>
          <span className="amount">36,000</span>
          <span className="currency">EGP</span>
        </LimitAmount>
        
        <LimitSubtext>
          Up to 1,200,000 EGP in last slots
        </LimitSubtext>
        
        <ExploreButton onClick={handleExploreOptions}>
          Explore your options
          <ChevronRight size={20} />
        </ExploreButton>
      </LimitCard>

      <SectionHeader>
        <SectionTitle>Recommended Circles</SectionTitle>
        <SeeAllButton onClick={handleSeeAll}>See all</SeeAllButton>
      </SectionHeader>

      {showReminder && (
        <PaymentReminder>
          <CloseButton onClick={handleCloseReminder}>
            <X size={20} />
          </CloseButton>
          
          <ReminderTitle>Upcoming payment reminder</ReminderTitle>
          <ReminderText>
            5 days left to pay. Pay now to keep your circle running smoothly.
          </ReminderText>
          
          <PaymentSection>
            <PaymentLabel>Pay-in payment</PaymentLabel>
            <PaymentItem>
              <PaymentDetails>
                <div className="month">February pay-in</div>
              </PaymentDetails>
              <PaymentAmount>5,000 EGP</PaymentAmount>
            </PaymentItem>
          </PaymentSection>
          
          <ActionButtons>
            <SecondaryButton onClick={handleCircleDetails}>
              Circle details
            </SecondaryButton>
            <PrimaryButton onClick={handlePayment}>
              Pay 5,000 EGP
            </PrimaryButton>
          </ActionButtons>
        </PaymentReminder>
      )}

      <BottomIndicator />
    </AppContainer>
  )
}

export default App